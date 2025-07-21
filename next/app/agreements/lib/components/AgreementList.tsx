import React from "react";
import { redirect } from "next/navigation";
import { Routes } from "@/app/lib/constants";
import { getAgreements } from "../data";
import { AgreementTable } from "./AgreementTable";

export const AgreementList = async (props: {
  page: number;
  pageSize: number;
  filters: { [key: string]: string };
  sorts: { [key: string]: string };
}) => {
  const navigationAction = async (id: number) => {
    "use server";
    redirect(`${Routes.CreditAgreements}/${id}`);
  };
  const [agreements, totalNumberOfAgreements] = await getAgreements(
    props.page,
    props.pageSize,
    props.filters,
    props.sorts,
  );

  return (
    <AgreementTable
      agreements={agreements}
      totalNumberOfAgreements={totalNumberOfAgreements}
      navigationAction={navigationAction}
    />
  );
};
