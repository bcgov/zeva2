import { prisma } from "@/lib/prisma";
import { prismaOld } from "@/lib/prismaOld";
import {
  ModelYear,
  ZevClass,
  VehicleClass,
  BalanceType,
  CreditApplicationVinLegacy,
} from "./generated/client";
import { getStringsToModelYearsEnumsMap } from "@/app/lib/utils/enumMaps";
import { Decimal } from "./generated/client/runtime/library";
import { Notification } from "./generated/client";
import { isNotification } from "@/app/lib/utils/typeGuards";
import { seedOrganizations } from "./seedProcesses/seedOrganizations";
import { seedTransactions } from "./seedProcesses/seedTransactions";
import { seedIcbc } from "./seedProcesses/seedIcbc";
import { seedUsers } from "./seedProcesses/seedUsers";
import { seedAgreements } from "./seedProcesses/seedAgreements";
import { seedVolumes } from "./seedProcesses/seedVolumes";
import { seedVehicles } from "./seedProcesses/seedVehicles";
import { seedLegacyAssessedMyrs } from "./seedProcesses/seedLegacyAssessedMyrs";

// prismaOld to interact with old zeva db; prisma to interact with new zeva db
const main = () => {
  const modelYearsMap = getStringsToModelYearsEnumsMap();
  return prisma.$transaction(
    async (tx) => {
      const decimalZero = new Decimal(0);
      const mapOfModelYearIdsToModelYearEnum: {
        [id: number]: ModelYear | undefined;
      } = {};
      const mapOfOldCreditClassIdsToZevClasses: {
        [id: number]: ZevClass | undefined;
      } = {};

      const modelYearsOld = await prismaOld.model_year.findMany();
      for (const modelYearOld of modelYearsOld) {
        mapOfModelYearIdsToModelYearEnum[modelYearOld.id] =
          modelYearsMap[modelYearOld.description];
      }

      // seed organization tables
      const { mapOfOldOrgIdsToNewOrgIds } = await seedOrganizations(
        tx,
        mapOfModelYearIdsToModelYearEnum,
      );

      // seed user tables
      const mapOfOldUserIdsToNewUserIds = await seedUsers(
        tx,
        mapOfOldOrgIdsToNewOrgIds,
      );

      const creditClassesOld = await prismaOld.credit_class_code.findMany();
      for (const creditClass of creditClassesOld) {
        mapOfOldCreditClassIdsToZevClasses[creditClass.id] =
          ZevClass[creditClass.credit_class as keyof typeof ZevClass];
      }

      // add notifications from old subscription table
      const notificationsOld = await prismaOld.notification.findMany({
        select: { id: true, notification_code: true },
      });

      const notifCodeById = notificationsOld.reduce<Record<number, string>>(
        (acc, n) => {
          acc[n.id] = n.notification_code;
          return acc;
        },
        {},
      );

      const subsOld = await prismaOld.notification_subscription.findMany({
        select: { user_profile_id: true, notification_id: true },
      });

      const grouped = subsOld.reduce<Record<number, string[]>>((acc, sub) => {
        const code = notifCodeById[sub.notification_id];
        if (!code) return acc;
        acc[sub.user_profile_id] ??= [];
        acc[sub.user_profile_id].push(code);
        return acc;
      }, {});

      for (const [oldUserId, codes] of Object.entries(grouped)) {
        const newUserId = mapOfOldUserIdsToNewUserIds[Number(oldUserId)];
        if (!newUserId) continue;

        const validNotifications = codes
          .map((code) => code as Notification)
          .filter((n) => isNotification(n));

        await tx.user.update({
          where: { id: newUserId },
          data: { notifications: { set: validNotifications } },
        });
      }

      await seedTransactions(
        tx,
        mapOfOldCreditClassIdsToZevClasses,
        mapOfModelYearIdsToModelYearEnum,
        mapOfOldOrgIdsToNewOrgIds,
      );

      /** Uncomment the following code to seed Agreement tables for local testing **/
      // await seedAgreements(
      //   tx,
      //   mapOfOldCreditClassIdsToZevClasses,
      //   mapOfModelYearIdsToModelYearEnum,
      //   mapOfOldOrgIdsToNewOrgIds,
      // );

      // add ending balances
      type OldBalance = {
        idOld: number;
        orgIdOld: number;
        balanceType: BalanceType;
        complianceYearIdOld: number;
        creditAValue: Decimal | null;
        creditBValue: Decimal | null;
        modelYearIdOld: number;
        fromReassessment: boolean;
      };
      const creditCategory = "ProvisionalBalanceAfterCreditReduction";
      const debitCategory = "CreditDeficit";
      const endingBalancesOld =
        await prismaOld.model_year_report_compliance_obligation.findMany({
          include: {
            model_year_report: true,
          },
        });
      const reassessmentEndingBalancesOld =
        await prismaOld.supplemental_report_credit_activity.findMany({
          include: {
            supplemental_report: {
              include: {
                model_year_report: true,
              },
            },
          },
        });
      const balancesOld: OldBalance[] = [];
      for (const balance of endingBalancesOld) {
        const category = balance.category;
        if (
          (category === creditCategory || category === debitCategory) &&
          balance.from_gov
        ) {
          balancesOld.push({
            idOld: balance.id,
            orgIdOld: balance.model_year_report.organization_id,
            balanceType:
              category === creditCategory
                ? BalanceType.CREDIT
                : BalanceType.DEBIT,
            complianceYearIdOld: balance.model_year_report.model_year_id,
            modelYearIdOld: balance.model_year_id,
            creditAValue: balance.credit_a_value,
            creditBValue: balance.credit_b_value,
            fromReassessment: false,
          });
        }
      }
      for (const balance of reassessmentEndingBalancesOld) {
        const status = balance.supplemental_report.status;
        const category = balance.category;
        if (
          balance.model_year_id &&
          (category === creditCategory || category === debitCategory) &&
          status === "ASSESSED"
        ) {
          balancesOld.push({
            idOld: balance.id,
            orgIdOld:
              balance.supplemental_report.model_year_report.organization_id,
            balanceType:
              category === creditCategory
                ? BalanceType.CREDIT
                : BalanceType.DEBIT,
            complianceYearIdOld:
              balance.supplemental_report.model_year_report.model_year_id,
            modelYearIdOld: balance.model_year_id,
            creditAValue: balance.credit_a_value,
            creditBValue: balance.credit_b_value,
            fromReassessment: true,
          });
        }
      }
      for (const balance of balancesOld) {
        const fromReassessment = balance.fromReassessment;
        const errorMessagePrefix = `${fromReassessment ? "SRCA " : "MYRCO "} ${balance.idOld} with unknown `;
        const modelYear =
          mapOfModelYearIdsToModelYearEnum[balance.modelYearIdOld];
        if (!modelYear) {
          throw new Error(errorMessagePrefix + "model year!");
        }
        const complianceYear =
          mapOfModelYearIdsToModelYearEnum[balance.complianceYearIdOld];
        if (!complianceYear) {
          throw new Error(errorMessagePrefix + "compliance year!");
        }
        const orgId = mapOfOldOrgIdsToNewOrgIds[balance.orgIdOld];
        if (!orgId) {
          throw new Error(errorMessagePrefix + "org id!");
        }

        const creditAValue = balance.creditAValue;
        const creditBValue = balance.creditBValue;
        const uniqueDataBase = {
          organizationId: orgId,
          complianceYear: complianceYear,
          vehicleClass: VehicleClass.REPORTABLE,
          modelYear: modelYear,
        };
        const data = {
          ...uniqueDataBase,
          type: balance.balanceType,
        };
        if (fromReassessment) {
          if (creditAValue && !creditAValue.equals(decimalZero)) {
            await tx.zevUnitEndingBalance.upsert({
              where: {
                organizationId_complianceYear_zevClass_vehicleClass_modelYear: {
                  ...uniqueDataBase,
                  zevClass: ZevClass.A,
                },
              },
              create: {
                ...data,
                zevClass: ZevClass.A,
                initialNumberOfUnits: creditAValue,
                finalNumberOfUnits: creditAValue,
              },
              update: {
                initialNumberOfUnits: creditAValue,
                finalNumberOfUnits: creditAValue,
              },
            });
          }
          if (creditBValue && !creditBValue.equals(decimalZero)) {
            await tx.zevUnitEndingBalance.upsert({
              where: {
                organizationId_complianceYear_zevClass_vehicleClass_modelYear: {
                  ...uniqueDataBase,
                  zevClass:
                    data.type === BalanceType.DEBIT
                      ? ZevClass.UNSPECIFIED
                      : ZevClass.B,
                },
              },
              create: {
                ...data,
                zevClass:
                  data.type === BalanceType.DEBIT
                    ? ZevClass.UNSPECIFIED
                    : ZevClass.B,
                initialNumberOfUnits: creditBValue,
                finalNumberOfUnits: creditBValue,
              },
              update: {
                initialNumberOfUnits: creditBValue,
                finalNumberOfUnits: creditBValue,
              },
            });
          }
        } else {
          if (creditAValue && !creditAValue.equals(decimalZero)) {
            await tx.zevUnitEndingBalance.create({
              data: {
                ...data,
                initialNumberOfUnits: creditAValue,
                finalNumberOfUnits: creditAValue,
                zevClass: ZevClass.A,
              },
            });
          }
          if (creditBValue && !creditBValue.equals(decimalZero)) {
            await tx.zevUnitEndingBalance.create({
              data: {
                ...data,
                initialNumberOfUnits: creditBValue,
                finalNumberOfUnits: creditBValue,
                zevClass:
                  data.type === BalanceType.DEBIT
                    ? ZevClass.UNSPECIFIED
                    : ZevClass.B,
              },
            });
          }
        }
      }

      await seedVehicles(
        tx,
        mapOfModelYearIdsToModelYearEnum,
        mapOfOldOrgIdsToNewOrgIds,
        mapOfOldCreditClassIdsToZevClasses,
      );

      const issuedVinRecords = await prismaOld.record_of_sale.findMany({
        where: {
          sales_submission: {
            is: {
              validation_status: "VALIDATED",
            },
          },
        },
        select: {
          vin: true,
        },
      });
      const legacyVinsToCreate: Omit<CreditApplicationVinLegacy, "id">[] = [];
      issuedVinRecords.forEach((record) => {
        const vin = record.vin;
        if (vin) {
          legacyVinsToCreate.push({ vin });
        }
      });
      await tx.creditApplicationVinLegacy.createMany({
        data: legacyVinsToCreate,
      });

      await seedIcbc(tx, mapOfModelYearIdsToModelYearEnum);

      await seedVolumes(
        tx,
        mapOfModelYearIdsToModelYearEnum,
        mapOfOldOrgIdsToNewOrgIds,
      );

      await seedLegacyAssessedMyrs(
        tx,
        mapOfModelYearIdsToModelYearEnum,
        mapOfOldOrgIdsToNewOrgIds,
      );
    },
    {
      timeout: 10000,
    },
  );
};

main()
  .then(async () => {
    console.log("seed successful");
    await prisma.$disconnect();
    await prismaOld.$disconnect();
  })
  .catch(async (e) => {
    console.log(e);
    await prisma.$disconnect();
    await prismaOld.$disconnect();
    process.exit(1);
  });
