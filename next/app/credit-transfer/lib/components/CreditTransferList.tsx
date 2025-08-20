import React from "react";
import { getCreditTransfers } from "../data";
import { CreditTransfersTable } from "./CreditTransfersTable";
import { getSerializedTransfers } from "../utils";
import { getUserInfo } from "@/auth";

export const CreditTransferList = async (props: {
  page: number;
  pageSize: number;
  filters: Record<string, string>;
  sorts: Record<string, string>;
}) => {
  const { userIsGov } = await getUserInfo();
  const [transfers, totalNumberOfTransfers] = await getCreditTransfers(
    props.page,
    props.pageSize,
    props.filters,
    props.sorts,
  );
  const serializedTransfers = getSerializedTransfers(transfers, userIsGov);
  return (
    <CreditTransfersTable
      transfers={serializedTransfers}
      totalNumbeOfTransfers={totalNumberOfTransfers}
    />
  );
};
