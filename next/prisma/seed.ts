import { prisma } from "@/lib/prisma";
import { prismaOld } from "@/lib/prismaOld";
import {
  ModelYear,
  Role,
  Idp,
  ZevClass,
  TransactionType,
  VehicleClass,
  BalanceType,
} from "./generated/client";
import { getModelYearEnum, getRoleEnum } from "@/lib/utils/getEnums";
import { Decimal } from "./generated/client/runtime/library";

// prismaOld to interact with old zeva db; prisma to interact with new zeva db
const main = () => {
  return prisma.$transaction(async (tx) => {
    const decimalZero = new Decimal(0);
    const mapOfModelYearIdsToModelYearEnum: {
      [id: number]: ModelYear | undefined;
    } = {};
    const mapOfRoleIdsToRoleEnum: { [id: number]: Role | undefined } = {};
    const mapOfOldOrgIdsToNewOrgIds: { [id: number]: number } = {};
    const mapOfOldUserIdsToNewUserIds: { [id: number]: number } = {};

    const modelYearsOld = await prismaOld.model_year.findMany();
    for (const modelYearOld of modelYearsOld) {
      mapOfModelYearIdsToModelYearEnum[modelYearOld.id] = getModelYearEnum(
        modelYearOld.description,
      );
    }

    const rolesOld = await prismaOld.role.findMany();
    for (const roleOld of rolesOld) {
      mapOfRoleIdsToRoleEnum[roleOld.id] = getRoleEnum(roleOld.role_code);
    }

    // add orgs:
    const orgsOld = await prismaOld.organization.findMany();
    for (const orgOld of orgsOld) {
      const orgNew = await tx.organization.create({
        data: {
          name: orgOld.organization_name,
          firstModelYear:
            mapOfModelYearIdsToModelYearEnum[
              orgOld.first_model_year_id ?? -1
            ] ?? ModelYear.MY_2019,
          isGovernment: orgOld.is_government,
        },
      });
      mapOfOldOrgIdsToNewOrgIds[orgOld.id] = orgNew.id;
    }

    // add users:
    const usersOld = await prismaOld.user_profile.findMany({
      include: {
        organization: true,
      },
    });
    for (const [index, userOld] of usersOld.entries()) {
      const userNew = await tx.user.create({
        data: {
          contactEmail: userOld.email,
          idpEmail:
            userOld.keycloak_email ?? "noSuchEmail" + index + "@email.com",
          idpSub: userOld.keycloak_user_id,
          idp: userOld.organization?.is_government
            ? Idp.IDIR
            : Idp.BCEID_BUSINESS,
          idpUsername: userOld.username,
          isActive: userOld.is_active,
          organizationId: mapOfOldOrgIdsToNewOrgIds[userOld.organization_id!],
        },
      });
      mapOfOldUserIdsToNewUserIds[userOld.id] = userNew.id;
    }

    // update each user with their roles:
    const usersRolesOld = await prismaOld.user_role.findMany();
    for (const userRoleOld of usersRolesOld) {
      await tx.user.update({
        where: {
          id: mapOfOldUserIdsToNewUserIds[userRoleOld.user_profile_id],
        },
        data: {
          roles: {
            push: mapOfRoleIdsToRoleEnum[userRoleOld.role_id],
          },
        },
      });
    }

    // add ZevUnitTransactions (in old db, these are called credit transactions)
    const mapOfOldCreditClassIdsToZevClasses: {
      [id: number]: ZevClass | undefined;
    } = {};
    const creditClassesOld = await prismaOld.credit_class_code.findMany();
    for (const creditClass of creditClassesOld) {
      mapOfOldCreditClassIdsToZevClasses[creditClass.id] =
        ZevClass[creditClass.credit_class as keyof typeof ZevClass];
    }

    const creditTransactionsOld = await prismaOld.credit_transaction.findMany();
    for (const transaction of creditTransactionsOld) {
      let transactionType;
      let organizationId;
      const zevClass =
        mapOfOldCreditClassIdsToZevClasses[transaction.credit_class_id];
      const modelYear =
        mapOfModelYearIdsToModelYearEnum[transaction.model_year_id];
      if (!zevClass) {
        throw new Error(
          "unknown credit class when seeding ZevUnitTransactions",
        );
      }
      if (!modelYear) {
        throw new Error("unknown model year when seeding ZevUnitTransactions");
      }
      const totalValueOld = transaction.total_value;
      const numberOfUnits = totalValueOld.lessThan(decimalZero)
        ? totalValueOld.times(new Decimal(-1))
        : totalValueOld;
      if (transaction.credit_to_id && !transaction.debit_from_id) {
        transactionType = TransactionType.CREDIT;
        organizationId = transaction.credit_to_id;
      } else if (!transaction.credit_to_id && transaction.debit_from_id) {
        transactionType = TransactionType.DEBIT;
        organizationId = transaction.debit_from_id;
      }

      if (transactionType && organizationId) {
        await tx.zevUnitTransaction.create({
          data: {
            type: transactionType,
            organizationId: mapOfOldOrgIdsToNewOrgIds[organizationId],
            numberOfUnits: numberOfUnits,
            zevClass: zevClass,
            vehicleClass: VehicleClass.REPORTABLE,
            modelYear: modelYear,
            timestamp: transaction.transaction_timestamp,
          },
        });
      } else if (transaction.credit_to_id && transaction.debit_from_id) {
        await tx.zevUnitTransaction.create({
          data: {
            type: TransactionType.CREDIT,
            organizationId: mapOfOldOrgIdsToNewOrgIds[transaction.credit_to_id],
            numberOfUnits: numberOfUnits,
            zevClass: zevClass,
            vehicleClass: VehicleClass.REPORTABLE,
            modelYear: modelYear,
            timestamp: transaction.transaction_timestamp,
          },
        });
        await tx.zevUnitTransaction.create({
          data: {
            type: TransactionType.TRANSFER_AWAY,
            organizationId:
              mapOfOldOrgIdsToNewOrgIds[transaction.debit_from_id],
            numberOfUnits: numberOfUnits,
            zevClass: zevClass,
            vehicleClass: VehicleClass.REPORTABLE,
            modelYear: modelYear,
            timestamp: transaction.transaction_timestamp,
          },
        });
      }
    }

    // add ending balances;
    // for now, just look at model_year_report_compliance_obligation and get records that belong to
    // the ProvisionalBalanceAfterCreditReduction category and is fromGov;
    // there are cases where this will be the wrong ending balance because we also need to take
    // into account records that belong in the CreditDeficit category,
    // and also at records in the supplemental_report_credit_activity table
    const endingBalancesOld =
      await prismaOld.model_year_report_compliance_obligation.findMany({
        include: {
          model_year_report: true,
        },
      });
    for (const balance of endingBalancesOld) {
      const modelYear = mapOfModelYearIdsToModelYearEnum[balance.model_year_id];
      if (!modelYear) {
        throw new Error("unknown model year when seeding ending balances");
      }
      const complianceYear =
        mapOfModelYearIdsToModelYearEnum[
          balance.model_year_report.model_year_id
        ];
      if (!complianceYear) {
        throw new Error(
          "unknown compliance year year when seeding ending balances",
        );
      }
      const category = balance.category;
      const fromGov = balance.from_gov;
      if (category === "ProvisionalBalanceAfterCreditReduction" && fromGov) {
        const orgId =
          mapOfOldOrgIdsToNewOrgIds[balance.model_year_report.organization_id];
        const creditAValue = balance.credit_a_value;
        const creditBValue = balance.credit_b_value;
        if (!creditAValue.equals(decimalZero)) {
          await tx.zevUnitEndingBalance.create({
            data: {
              organizationId: orgId,
              complianceYear: complianceYear,
              type: BalanceType.CREDIT,
              initialNumberOfUnits: creditAValue,
              finalNumberOfUnits: creditAValue,
              zevClass: ZevClass.A,
              vehicleClass: VehicleClass.REPORTABLE,
              modelYear: modelYear,
            },
          });
        }
        if (!creditBValue.equals(decimalZero)) {
          await tx.zevUnitEndingBalance.create({
            data: {
              organizationId: orgId,
              complianceYear: complianceYear,
              type: BalanceType.CREDIT,
              initialNumberOfUnits: creditBValue,
              finalNumberOfUnits: creditBValue,
              zevClass: ZevClass.B,
              vehicleClass: VehicleClass.REPORTABLE,
              modelYear: modelYear,
            },
          });
        }
      }
    }
  });
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
