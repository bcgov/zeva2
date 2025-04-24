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
  ZevUnitTransferStatuses,
  ZevUnitTransferHistory,
  VehicleClassCode,
  VehicleZevType,
} from "./generated/client";
import { getModelYearEnum, getRoleEnum } from "@/lib/utils/getEnums";
import { Decimal } from "./generated/client/runtime/library";
import { Notification } from "./generated/client";
import { isNotification } from "@/app/lib/utils/typeGuards";

// prismaOld to interact with old zeva db; prisma to interact with new zeva db
const main = () => {
  return prisma.$transaction(async (tx) => {
    const decimalZero = new Decimal(0);
    const mapOfModelYearIdsToModelYearEnum: {
      [id: number]: ModelYear | undefined;
    } = {};
    const mapOfRoleIdsToRoleEnum: { [id: number]: Role | undefined } = {};
    const mapOfOldOrgIdsToNewOrgIds: { [id: number]: number | undefined } = {};
    const mapOfOldUserIdsToNewUserIds: { [id: number]: number | undefined } =
      {};
    const mapOfOldUsernamesToNewUserIds: {
      [username: string]: number | undefined;
    } = {};
    const mapOfOldCreditTransferIdsToNewZevUnitTransferIds: {
      [id: number]: number | undefined;
    } = {};
    const mapOfOldTransferStatusesToNewTransferStatuses: {
      [key: string]: ZevUnitTransferStatuses | undefined;
    } = {
      DRAFT: ZevUnitTransferStatuses.DRAFT,
      SUBMITTED: ZevUnitTransferStatuses.SUBMITTED_TO_TRANSFER_TO,
      APPROVED: ZevUnitTransferStatuses.APPROVED_BY_TRANSFER_TO,
      DISAPPROVED: ZevUnitTransferStatuses.REJECTED_BY_TRANSFER_TO,
      RECOMMEND_APPROVAL: ZevUnitTransferStatuses.RECOMMEND_APPROVAL_GOV,
      RECOMMEND_REJECTION: ZevUnitTransferStatuses.RECOMMEND_REJECTION_GOV,
      VALIDATED: ZevUnitTransferStatuses.APPROVED_BY_GOV,
      RESCIND_PRE_APPROVAL: ZevUnitTransferStatuses.RESCINDED_BY_TRANSFER_FROM,
      RESCINDED: ZevUnitTransferStatuses.RESCINDED_BY_TRANSFER_FROM,
      REJECTED: ZevUnitTransferStatuses.REJECTED_BY_GOV,
      DELETED: ZevUnitTransferStatuses.DELETED,
    };
    const mapOfOldCreditClassIdsToZevClasses: {
      [id: number]: ZevClass | undefined;
    } = {};

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
      if (!userOld.organization_id) {
        throw new Error("user " + userOld.id + " with no org id!");
      }
      const orgIdNew = mapOfOldOrgIdsToNewOrgIds[userOld.organization_id];
      if (!orgIdNew) {
        throw new Error("user " + userOld.id + " with unknown org id!");
      }
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
          organizationId: orgIdNew,
        },
      });
      mapOfOldUserIdsToNewUserIds[userOld.id] = userNew.id;
      mapOfOldUsernamesToNewUserIds[userOld.username] = userNew.id;
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

    // add ZevUnitTransactions (in old db, these are called credit transactions)
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
          "credit transaction " +
            transaction.id +
            " with unknown credit class!",
        );
      }
      if (!modelYear) {
        throw new Error(
          "credit transaction " + transaction.id + " with unknown model year!",
        );
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
        const newOrgId = mapOfOldOrgIdsToNewOrgIds[organizationId];
        if (!newOrgId) {
          throw new Error(
            "credit transaction " + transaction.id + " with unknown org id!",
          );
        }
        await tx.zevUnitTransaction.create({
          data: {
            type: transactionType,
            organizationId: newOrgId,
            numberOfUnits: numberOfUnits,
            zevClass: zevClass,
            vehicleClass: VehicleClass.REPORTABLE,
            modelYear: modelYear,
            timestamp: transaction.transaction_timestamp,
          },
        });
      } else if (transaction.credit_to_id && transaction.debit_from_id) {
        const newCreditToOrgId =
          mapOfOldOrgIdsToNewOrgIds[transaction.credit_to_id];
        const newDebitFromOrgId =
          mapOfOldOrgIdsToNewOrgIds[transaction.debit_from_id];
        if (!newCreditToOrgId) {
          throw new Error(
            "credit transaction " +
              transaction.id +
              " with unknown credit to id!",
          );
        }
        if (!newDebitFromOrgId) {
          throw new Error(
            "credit transaction " +
              transaction.id +
              " with unknown debit from id!",
          );
        }
        await tx.zevUnitTransaction.create({
          data: {
            type: TransactionType.CREDIT,
            organizationId: newCreditToOrgId,
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
            organizationId: newDebitFromOrgId,
            numberOfUnits: numberOfUnits,
            zevClass: zevClass,
            vehicleClass: VehicleClass.REPORTABLE,
            modelYear: modelYear,
            timestamp: transaction.transaction_timestamp,
          },
        });
      }
    }

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
                zevClass: ZevClass.B,
              },
            },
            create: {
              ...data,
              zevClass: ZevClass.B,
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
              zevClass: ZevClass.B,
            },
          });
        }
      }
    }

    // add ZEV Unit Transfer (formerly Credit Transfer in old DB) records
    const creditTransfersOld = await prismaOld.credit_transfer.findMany();
    for (const creditTransferOld of creditTransfersOld) {
      const oldStatus = creditTransferOld.status;
      const status = mapOfOldTransferStatusesToNewTransferStatuses[oldStatus];
      if (!status) {
        throw new Error(
          "unknown status: " +
            oldStatus +
            " when seeding credit transfer " +
            creditTransferOld.id,
        );
      }
      const newCreditToOrgId =
        mapOfOldOrgIdsToNewOrgIds[creditTransferOld.credit_to_id];
      const newDebitFromOrgId =
        mapOfOldOrgIdsToNewOrgIds[creditTransferOld.debit_from_id];
      if (!newCreditToOrgId) {
        throw new Error(
          "credit transfer " +
            creditTransferOld.id +
            " with unknown credit to id!",
        );
      }
      if (!newDebitFromOrgId) {
        throw new Error(
          "credit trasnfer " +
            creditTransferOld.id +
            " with unknown debit from id!",
        );
      }
      const zevUnitTransfer = await tx.zevUnitTransfer.create({
        data: {
          transferToId: newCreditToOrgId,
          transferFromId: newDebitFromOrgId,
          status: status,
          legacyId: creditTransferOld.id,
        },
      });
      mapOfOldCreditTransferIdsToNewZevUnitTransferIds[creditTransferOld.id] =
        zevUnitTransfer.id;
    }

    // add ZEV Unit Transfer Content (formerly Credit Transfer Content in old DB) records
    const creditTransferContentsOld =
      await prismaOld.credit_transfer_content.findMany();
    for (const creditTransferContentOld of creditTransferContentsOld) {
      const zevClass =
        mapOfOldCreditClassIdsToZevClasses[
          creditTransferContentOld.credit_class_id
        ];
      if (!zevClass) {
        throw new Error(
          "Unknown credit class in credit_transfer_content. Old record id: " +
            creditTransferContentOld.id,
        );
      }
      const modelYear =
        mapOfModelYearIdsToModelYearEnum[
          creditTransferContentOld.model_year_id
        ];
      if (!modelYear) {
        throw new Error(
          "Unknown model year in credit_transfer_content. Old record id: " +
            creditTransferContentOld.id,
        );
      }
      const newCreditTransferId =
        mapOfOldCreditTransferIdsToNewZevUnitTransferIds[
          creditTransferContentOld.credit_transfer_id
        ];
      if (!newCreditTransferId) {
        throw new Error(
          "credit transfer content " +
            creditTransferContentOld.id +
            " with unknown transfer id!",
        );
      }

      await tx.zevUnitTransferContent.create({
        data: {
          zevUnitTransferId: newCreditTransferId,
          numberOfUnits: creditTransferContentOld.credit_value,
          dollarValuePerUnit: creditTransferContentOld.dollar_value,
          zevClass,
          modelYear,
          vehicleClass: VehicleClass.REPORTABLE,
        },
      });
    }

    // add ZevUnitTransferHistories (previously called credit transfer histories)
    const mapOfTransferIdsToHistories: {
      [id: number]: Omit<ZevUnitTransferHistory, "id">[];
    } = {};
    const creditTransferHistoriesOld =
      await prismaOld.credit_transfer_history.findMany({
        include: {
          credit_transfer_comment: true,
        },
      });
    for (const creditTransferHistoryOld of creditTransferHistoriesOld) {
      const newTransferId =
        mapOfOldCreditTransferIdsToNewZevUnitTransferIds[
          creditTransferHistoryOld.transfer_id
        ];
      const newCreateUserId =
        mapOfOldUsernamesToNewUserIds[creditTransferHistoryOld.create_user];
      const newStatus =
        mapOfOldTransferStatusesToNewTransferStatuses[
          creditTransferHistoryOld.status
        ];
      const timestamp = creditTransferHistoryOld.create_timestamp;
      if (
        newStatus === ZevUnitTransferStatuses.DRAFT ||
        newStatus === ZevUnitTransferStatuses.DELETED
      ) {
        continue;
      }
      if (!newTransferId) {
        throw new Error(
          "transfer history " +
            creditTransferHistoryOld.id +
            " with unknown transfer id!",
        );
      }
      if (!newCreateUserId) {
        throw new Error(
          "transfer history " +
            creditTransferHistoryOld.id +
            " with unknown create user!",
        );
      }
      if (!newStatus) {
        throw new Error(
          "transfer history " +
            creditTransferHistoryOld.id +
            " with unknown status!",
        );
      }
      if (!timestamp) {
        throw new Error(
          "transfer history " +
            creditTransferHistoryOld.id +
            " with no create_timestamp!",
        );
      }
      const commentArray = [];
      for (const oldComment of creditTransferHistoryOld.credit_transfer_comment) {
        const text =
          oldComment.create_user + ": " + oldComment.credit_transfer_comment;
        if (text) {
          commentArray.push(text);
        }
      }
      const newTransferHistoryData = {
        zevUnitTransferId: newTransferId,
        afterUserActionStatus: newStatus,
        userId: newCreateUserId,
        timestamp: timestamp,
        comment: commentArray.length > 0 ? commentArray.join(" | ") : null,
      };
      if (!mapOfTransferIdsToHistories[newTransferId]) {
        mapOfTransferIdsToHistories[newTransferId] = [];
      }
      mapOfTransferIdsToHistories[newTransferId].push(newTransferHistoryData);
    }
    for (const histories of Object.values(mapOfTransferIdsToHistories)) {
      histories.sort((a, b) => {
        if (a.timestamp < b.timestamp) {
          return -1;
        } else if (a.timestamp > b.timestamp) {
          return 1;
        }
        return 0;
      });
      // remove "submitted-rescinded pairs" where "rescinded" is not the status of the final history record
      let counter = null;
      let leftIndex = Number.POSITIVE_INFINITY;
      let rightIndex = Number.NEGATIVE_INFINITY;
      const indicesToRemove = new Set();
      for (const [index, history] of histories.entries()) {
        const status = history.afterUserActionStatus;
        if (status === ZevUnitTransferStatuses.SUBMITTED_TO_TRANSFER_TO) {
          leftIndex = index;
          counter = counter === null ? -1 : counter - 1;
        } else if (
          status === ZevUnitTransferStatuses.RESCINDED_BY_TRANSFER_FROM
        ) {
          rightIndex = index;
          counter = counter === null ? 1 : counter + 1;
        }
        if (counter === 0 && rightIndex !== histories.length - 1) {
          for (let i = leftIndex; i <= rightIndex; i++) {
            indicesToRemove.add(i);
          }
        }
      }
      const filteredHistories = histories.filter((_, index) => {
        if (indicesToRemove.has(index)) {
          return false;
        }
        return true;
      });
      const result: Omit<ZevUnitTransferHistory, "id">[] = [];
      let previousStatus: ZevUnitTransferStatuses | null = null;
      for (const history of filteredHistories) {
        const status = history.afterUserActionStatus;
        if (status === previousStatus) {
          // move comments
          const comment = history.comment;
          if (comment) {
            const previousHistory = result[result.length - 1];
            let existingComment = previousHistory.comment;
            if (existingComment) {
              previousHistory.comment = existingComment + " | " + comment;
            } else {
              previousHistory.comment = comment;
            }
          }
          continue;
        }
        if (
          status === ZevUnitTransferStatuses.APPROVED_BY_TRANSFER_TO &&
          (previousStatus === ZevUnitTransferStatuses.RECOMMEND_APPROVAL_GOV ||
            previousStatus === ZevUnitTransferStatuses.RECOMMEND_REJECTION_GOV)
        ) {
          history.afterUserActionStatus =
            ZevUnitTransferStatuses.RETURNED_TO_ANALYST;
        }
        result.push(history);
        previousStatus = status;
      }
      for (const [index, history] of result.entries()) {
        const comment = history.comment;
        if (
          history.afterUserActionStatus ===
            ZevUnitTransferStatuses.APPROVED_BY_TRANSFER_TO &&
          comment &&
          (result[index + 1]?.afterUserActionStatus ===
            ZevUnitTransferStatuses.RECOMMEND_APPROVAL_GOV ||
            result[index + 1]?.afterUserActionStatus ===
              ZevUnitTransferStatuses.RECOMMEND_REJECTION_GOV)
        ) {
          history.comment = null;
          result[index + 1].comment =
            comment + (result[index + 1].comment ?? "");
        }
      }
      await tx.zevUnitTransferHistory.createMany({
        data: result,
      });
    }

    const vClassIdToEnum: Record<number, VehicleClassCode> = {};
    for (const r of await prismaOld.vehicle_class_code.findMany()) {
      vClassIdToEnum[r.id] = r.vehicle_class_code as VehicleClassCode;
    }

    const vZevIdToEnum: Record<number, VehicleZevType> = {};
    for (const r of await prismaOld.vehicle_zev_type.findMany()) {
      vZevIdToEnum[r.id] = r.vehicle_zev_code as VehicleZevType;
    }

    const oldVehIdToNew: Record<number, number> = {};

    const vehiclesOld = await prismaOld.vehicle.findMany();

    for (const vehicleOld of vehiclesOld) {
      const modelYearEnum =
        mapOfModelYearIdsToModelYearEnum[vehicleOld.model_year_id];
      const orgNewId = mapOfOldOrgIdsToNewOrgIds[vehicleOld.organization_id];
      if (!modelYearEnum) {
        throw new Error(
          "vehicle with id " + vehicleOld.id + " has unknown model year!",
        );
      }
      if (orgNewId === undefined) {
        throw new Error(
          "vehicle with id " + vehicleOld.id + " has unknown orgId",
        );
      }
      const zevEnum = vZevIdToEnum[vehicleOld.vehicle_zev_type_id];
      const classEnum = vClassIdToEnum[vehicleOld.vehicle_class_code_id];
      const creditEnum = vehicleOld.credit_class_id
        ? mapOfOldCreditClassIdsToZevClasses[vehicleOld.credit_class_id]
        : undefined;

      const created = await tx.vehicle.create({
        select: { id: true },
        data: {
          range: vehicleOld.range,
          make: vehicleOld.make,
          createTimestamp: vehicleOld.create_timestamp,
          updateTimestamp: vehicleOld.update_timestamp,
          modelYear: { set: [modelYearEnum] },
          validationStatus: vehicleOld.validation_status,
          modelName: vehicleOld.model_name,
          creditValue: vehicleOld.credit_value,
          vehicleZevType: { set: [zevEnum] },
          vehicleClassCode: { set: [classEnum] },
          weightKg: Number(vehicleOld.weight_kg),
          organizationId: orgNewId,
          createUser: vehicleOld.create_user,
          updateUser: vehicleOld.update_user,
          creditClass: creditEnum,
          hasPassedUs06Test: vehicleOld.has_passed_us_06_test,
          isActive: vehicleOld.is_active,
        },
      });

      oldVehIdToNew[vehicleOld.id] = created.id;
    }

    for (const historyOld of await prismaOld.vehicle_change_history.findMany()) {
      const vehIdNew = oldVehIdToNew[historyOld.vehicle_id];

      await tx.vehicleChangeHistory.create({
        data: {
          createTimestamp: historyOld.create_timestamp,
          vehicleClassCode: {
            set: [vClassIdToEnum[historyOld.vehicle_class_code_id]],
          },
          createUser: historyOld.create_user,
          vehicleZevType: {
            set: [vZevIdToEnum[historyOld.vehicle_zev_type_id]],
          },
          range: historyOld.range,
          make: historyOld.make,
          weightKg: historyOld.weight_kg,
          modelName: historyOld.model_name,
          modelYearId: historyOld.model_year_id,
          organizationId:
            mapOfOldOrgIdsToNewOrgIds[historyOld.organization_id]!,
          validationStatus: historyOld.validation_status,
          vehicleId: vehIdNew,
          userRole: historyOld.user_role,
        },
      });
    }

    const commentsOld = await prismaOld.vehicle_comment.findMany();

    for (const commentOld of commentsOld) {
      const vehIdNew = oldVehIdToNew[commentOld.vehicle_id];
      if (commentOld.vehicle_comment) {
        await tx.vehicleComment.create({
          data: {
            vehicleId: vehIdNew,
            createTimestamp: commentOld.create_timestamp,
            updateTimestamp: commentOld.update_timestamp,
            comment: commentOld.vehicle_comment,
            createUser: commentOld.create_user,
            updateUser: commentOld.update_user,
          },
        });
      }
    }

    const attachmentsOld = await prismaOld.vehicle_file_attachment.findMany();

    for (const attachemntOld of attachmentsOld) {
      const vehIdNew = oldVehIdToNew[attachemntOld.vehicle_id];

      await tx.vehicleAttachment.create({
        data: {
          vehicleId: vehIdNew,
          createTimestamp: attachemntOld.create_timestamp,
          updateTimestamp: attachemntOld.update_timestamp,
          createUser: attachemntOld.create_user,
          updateUser: attachemntOld.update_user,
          filename: attachemntOld.filename,
          minioObjectName: attachemntOld.minio_object_name,
          size: attachemntOld.size,
          mimeType: attachemntOld.mime_type,
          isRemoved: attachemntOld.is_removed,
        },
      });
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
