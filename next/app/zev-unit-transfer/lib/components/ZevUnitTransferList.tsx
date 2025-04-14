import React from "react";
import { getZevUnitTransfers } from "../data";
import ZevUnitTransferTable from "./ZevUnitTransferTable";
import { redirect } from "next/navigation";
import { Routes } from "@/app/lib/constants";

const ZevUnitTransferList = async (props: {
  page: number;
  pageSize: number;
  filters: { [key: string]: string };
  sorts: { [key: string]: string };
}) => {
  const navigationAction = async (id: string) => {
    "use server";
    redirect(`${Routes.CreditTransactions}/${id}`);
  };
  const [transfers, totalNumberOfTransfers] = await getZevUnitTransfers(
    props.page,
    props.pageSize,
    props.filters,
    props.sorts,
  );
  return (
    <ZevUnitTransferTable
      transfers={transfers}
      totalNumbeOfTransfers={totalNumberOfTransfers}
      navigationAction={navigationAction}
    />
  );
};

export default ZevUnitTransferList;
