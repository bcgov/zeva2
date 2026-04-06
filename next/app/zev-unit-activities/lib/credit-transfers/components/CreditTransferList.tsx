import { getCreditTransfers } from "../data";
import { CreditTransfersTable } from "./CreditTransfersTable";
import { getSerializedTransfers } from "../utilsServer";
import { getUserInfo } from "@/auth";
import { ReactNode } from "react";

export const CreditTransferList = async (props: {
  headerContent?: ReactNode;
}) => {
  const { userIsGov } = await getUserInfo();
  const transfers = await getCreditTransfers();
  const serializedTransfers = getSerializedTransfers(transfers, userIsGov);
  return (
    <CreditTransfersTable
      transfers={serializedTransfers}
      headerContent={props.headerContent}
    />
  );
};
