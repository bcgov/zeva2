import Decimal from "decimal.js";
import {
  CreditTransferSerialized,
  CreditTransferWithRelated,
  mapOfStatusToSupplierStatus,
} from "./constants";
import { CreditTransferStatus, ZevClass } from "@/prisma/generated/enums";
import { getIsoYmdString } from "@/app/lib/utils/date";

export const getSerializedTransfers = (
  transfers: CreditTransferWithRelated[],
  userIsGov: boolean,
): CreditTransferSerialized[] => {
  return transfers.map((transfer) => {
    let aCredits = new Decimal(0);
    let bCredits = new Decimal(0);
    let transferValue = new Decimal(0);
    for (const record of transfer.creditTransferContent) {
      const zevClass = record.zevClass;
      const numberOfUnits = record.numberOfUnits;
      if (zevClass === ZevClass.A) {
        aCredits = aCredits.plus(numberOfUnits);
      } else if (zevClass === ZevClass.B) {
        bCredits = bCredits.plus(numberOfUnits);
      }
      transferValue = transferValue.plus(
        numberOfUnits.times(record.dollarValuePerUnit),
      );
    }
    let submittedToTransferToDate = null;
    let approvedByTransferToDate = null;
    for (const record of transfer.creditTransferHistory) {
      const ts = getIsoYmdString(record.timestamp);
      const userAction = record.userAction;
      if (userAction === CreditTransferStatus.SUBMITTED_TO_TRANSFER_TO) {
        submittedToTransferToDate = ts;
      }
      if (userAction === CreditTransferStatus.APPROVED_BY_TRANSFER_TO) {
        approvedByTransferToDate = ts;
      }
    }
    return {
      id: transfer.id,
      status: userIsGov
        ? transfer.status
        : mapOfStatusToSupplierStatus[transfer.status],
      transferFrom: transfer.transferFrom.name,
      transferTo: transfer.transferTo.name,
      aCredits: aCredits.toFixed(2),
      bCredits: bCredits.toFixed(2),
      transferValue: transferValue.toFixed(2),
      submittedToTransferToDate,
      approvedByTransferToDate,
    };
  });
};
