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
  ZevUnitTransferCommentType,
  ZevUnitTransferHistory,
} from "./generated/client";
import { getModelYearEnum, getRoleEnum } from "@/lib/utils/getEnums";
import { Decimal } from "./generated/client/runtime/library";
import { Notification } from "./generated/client";

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
    
    const notifCodeById = notificationsOld.reduce<Record<number, string>>((acc, n) => {
      acc[n.id] = n.notification_code;
      return acc;
    }, {});
    
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
        .map(code => code as Notification)
        .filter((n): n is Notification => !!n);
    
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
      await prismaOld.credit_transfer_history.findMany();
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
      const newTransferHistoryData = {
        zevUnitTransferId: newTransferId,
        afterUserActionStatus: newStatus,
        userId: newCreateUserId,
        timestamp: timestamp,
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
          continue;
        }
        result.push(history);
        previousStatus = status;
      }
      await tx.zevUnitTransferHistory.createMany({
        data: result,
      });
    }
    
        // add ZevUnitTransferComments (previously called credit transfer comments)
        const creditTransferCommentsOld = await prismaOld.credit_transfer_comment.findMany({
          include: {
            credit_transfer_history: {
              include: {
                credit_transfer: true,
              },
            },
          },
        });
        for (const transferCommentOld of creditTransferCommentsOld) {
          const newTransferId =
            mapOfOldCreditTransferIdsToNewZevUnitTransferIds[
              transferCommentOld.credit_transfer_history.credit_transfer.id
            ];
          const newCreateUserId =
            mapOfOldUsernamesToNewUserIds[transferCommentOld.create_user];
          const newCreateUser = await tx.user.findUnique({
            where: {
              id: newCreateUserId,
            },
            include: {
              organization: true,
            },
          });
          const comment = transferCommentOld.credit_transfer_comment;
          const createTimestamp = transferCommentOld.create_timestamp;
          const updateTimestamp = transferCommentOld.update_timestamp;
          if (!newTransferId) {
            throw new Error(
              "transfer comment " +
                transferCommentOld.id +
                " with unknown transfer id!",
            );
          }
          if (!newCreateUserId) {
            throw new Error(
              "transfer comment " +
                transferCommentOld.id +
                " with unknown create user id!",
            );
          }
          if (!newCreateUser) {
            throw new Error(
              "transfer comment " +
                transferCommentOld.id +
                " with create user id not associated with a user!",
            );
          }
          if (!comment) {
            throw new Error(
              "transfer comment " + transferCommentOld.id + " with no comment!",
            );
          }
          if (!createTimestamp) {
            throw new Error(
              "transfer comment " +
                transferCommentOld.id +
                " with no create timestamp!",
            );
          }
          if (!updateTimestamp) {
            throw new Error(
              "transfer comment " +
                transferCommentOld.id +
                " with no update timestamp!",
            );
          }
        
          await tx.zevUnitTransferComment.create({
            data: {
              zevUnitTransferId: newTransferId,
              userId: newCreateUserId,
              createTimestamp: createTimestamp,
              updateTimestamp: updateTimestamp,
              comment: comment,
              // all supplier comments are to counterparty upon rescind,
              // and all government comments are internal
              commentType: newCreateUser.organization.isGovernment
                ? ZevUnitTransferCommentType.INTERNAL_GOV
                : ZevUnitTransferCommentType.TO_COUNTERPARTY_UPON_RESCIND,
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
    