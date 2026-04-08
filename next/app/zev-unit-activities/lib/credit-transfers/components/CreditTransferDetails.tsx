import { JSX } from "react";
import { getCreditTransfer } from "../data";
import { getUserInfo } from "@/auth";
import {
  getCreditTransferStatusEnumsToStringsMap,
  getModelYearEnumsToStringsMap,
  getVehicleClassEnumsToStringsMap,
  getZevClassEnumsToStringsMap,
} from "@/app/lib/utils/enumMaps";
import { mapOfStatusToSupplierStatus } from "../constants";

export const CreditTransferDetails = async (props: { id: number }) => {
  const transfer = await getCreditTransfer(props.id);
  if (!transfer) {
    return null;
  }
  const { userIsGov } = await getUserInfo();
  let status = transfer.status;
  if (!userIsGov) {
    status = mapOfStatusToSupplierStatus[status];
  }
  const vehicleClassesMap = getVehicleClassEnumsToStringsMap();
  const zevClassesMap = getZevClassEnumsToStringsMap();
  const modelYearsMap = getModelYearEnumsToStringsMap();
  const statusMap = getCreditTransferStatusEnumsToStringsMap();
  const transferContent: JSX.Element[] = [];
  for (const content of transfer.creditTransferContent) {
    transferContent.push(
      <ul key={content.id}>
        <li>Vehicle Class: {vehicleClassesMap[content.vehicleClass]}</li>
        <li>ZEV Class: {zevClassesMap[content.zevClass]}</li>
        <li>Model Year: {modelYearsMap[content.modelYear]}</li>
        <li>Number of units: {content.numberOfUnits.toString()}</li>
        <li>Dollar value per unit: {content.dollarValuePerUnit.toString()}</li>
        <li>
          Total Dollar Value:{" "}
          {content.numberOfUnits.times(content.dollarValuePerUnit).toString()}
        </li>
      </ul>,
    );
  }
  return (
    <div className="space-y-3">
      <ul>
        <li key="transferFrom">Transfer From: {transfer.transferFrom.name}</li>
        <li key="transferTo">Transfer To: {transfer.transferTo.name}</li>
        <li key="status">Status: {statusMap[status]}</li>
      </ul>
      {transferContent}
    </div>
  );
};
