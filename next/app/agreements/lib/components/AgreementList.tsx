import { redirect } from "next/navigation";
import { Routes } from "@/app/lib/constants";
import { getAgreements } from "../data";
import { AgreementTable } from "./AgreementTable";
import { getSerializedAgreements } from "../utilsServer";

export const AgreementList = async (props: {
  page: number;
  pageSize: number;
  filters: Record<string, string>;
  sorts: Record<string, string>;
  userIsGov: boolean;
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
  const serializedAgreements = getSerializedAgreements(agreements);

  return (
    <AgreementTable
      agreements={serializedAgreements}
      totalNumberOfAgreements={totalNumberOfAgreements}
      navigationAction={navigationAction}
      userIsGov={props.userIsGov}
    />
  );
};
