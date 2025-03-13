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
      SUBMITTED: ZevUnitTransferStatuses.SUBMITTED_TO_SUPPLIER,
      APPROVED: ZevUnitTransferStatuses.APPROVED_BY_SUPPLIER,
      DISAPPROVED: ZevUnitTransferStatuses.REJECTED_BY_SUPPLIER,
      RECOMMEND_APPROVAL: ZevUnitTransferStatuses.RECOMMEND_APPROVAL,
      RECOMMEND_REJECTION: ZevUnitTransferStatuses.RECOMMEND_REJECTION,
      VALIDATED: ZevUnitTransferStatuses.APPROVED_BY_GOV,
      RESCIND_PRE_APPROVAL: ZevUnitTransferStatuses.RESCINDED,
      RESCINDED: ZevUnitTransferStatuses.RESCINDED,
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
        throw new Error("MYRCO " + balance.id + " with unknown model year!");
      }
      const complianceYear =
        mapOfModelYearIdsToModelYearEnum[
          balance.model_year_report.model_year_id
        ];
      if (!complianceYear) {
        throw new Error(
          "MYRCO " + balance.id + " with unknown compliance year!",
        );
      }
      const category = balance.category;
      const fromGov = balance.from_gov;
      if (category === "ProvisionalBalanceAfterCreditReduction" && fromGov) {
        const orgId =
          mapOfOldOrgIdsToNewOrgIds[balance.model_year_report.organization_id];
        if (!orgId) {
          throw new Error("MYRCO " + balance.id + " with unknown org id!");
        }
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
          dollarValue: creditTransferContentOld.dollar_value,
          zevClass,
          modelYear,
          vehicleClass: VehicleClass.REPORTABLE,
        },
      });
    }

    const creditTransferHistoriesOld =
      await prismaOld.credit_transfer_history.findMany({
        orderBy: {
          create_timestamp: "desc",
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
      const newTransferHistory = await tx.zevUnitTransferHistory.findFirst({
        where: {
          afterUserActionStatus: newStatus,
          zevUnitTransferId: newTransferId,
        },
      });
      if (!newTransferHistory) {
        await tx.zevUnitTransferHistory.create({
          data: {
            zevUnitTransferId: newTransferId,
            afterUserActionStatus: newStatus,
            userId: newCreateUserId,
            timestamp: timestamp,
          },
        });
      } else {
        await tx.zevUnitTransferHistory.update({
          where: {
            id: newTransferHistory.id,
          },
          data: {
            userId: newCreateUserId,
            timestamp: timestamp,
          },
        });
      }
    }

    const creditTransferCommentsOld =
      await prismaOld.credit_transfer_comment.findMany({
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
