import { JSX } from "react";
import { getCreditTransfer } from "../data";
import { getHelpingMaps } from "@/app/model-year-report/lib/utilsClient";
import { getUserInfo } from "@/auth";
import { getCreditTransferStatusEnumsToStringsMap } from "@/app/lib/utils/enumMaps";

export const CreditTransferDetails = async (props: { id: number }) => {
  const transfer = await getCreditTransfer(props.id);
  if (!transfer) {
    return null;
  }
  const { userIsGov } = await getUserInfo();
  const helpingMaps = getHelpingMaps();
  const statusMap = getCreditTransferStatusEnumsToStringsMap();
  const transferContent: JSX.Element[] = [];
  for (const content of transfer.creditTransferContent) {
    transferContent.push(
      <ul key={content.id}>
        <li key="vehicleClass">
          Vehicle Class: {helpingMaps.vehicleClassesMap[content.vehicleClass]}
        </li>
        <li key="zevClass">
          ZEV Class: {helpingMaps.zevClassesMap[content.zevClass]}
        </li>
        <li key="modelYear">
          Model Year: {helpingMaps.modelYearsMap[content.modelYear]}
        </li>
        <li key="numberOfUnits">
          Number of units: {content.numberOfUnits.toString()}
        </li>
        <li key="dollarValuePerUnit">
          Dollar value per unit: {content.dollarValuePerUnit.toString()}
        </li>
        <li key="totalDollarValue">
          Total Dollar Value:{" "}
          {content.numberOfUnits.times(content.dollarValuePerUnit).toString()}
        </li>
      </ul>,
    );
  }
  return (
    <div className="space-y-3">
      <ul key={-1}>
        <li key="transferFrom">Transfer From: {transfer.transferFrom.name}</li>
        <li key="transferTo">Transfer To: {transfer.transferTo.name}</li>
        <li key="status">
          Status:{" "}
          {userIsGov
            ? statusMap[transfer.status]
            : statusMap[transfer.supplierStatus]}
        </li>
      </ul>
      {transferContent}
    </div>
  );
};
