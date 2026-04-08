import { redirect } from "next/navigation";
import { getCreditApplications } from "../data";
import { getSerializedApplications } from "../utilsServer";
import { ApplicationsTable } from "./ApplicationsTable";
import { Routes } from "@/app/lib/constants";
import { getUserInfo } from "@/auth";
import { ReactNode } from "react";

export const CreditApplicationList = async (props: {
  page: number;
  pageSize: number;
  filters: { [key: string]: string };
  sorts: { [key: string]: string };
  headerContent?: ReactNode;
}) => {
  const { userIsGov } = await getUserInfo();
  const navigationAction = async (id: number) => {
    "use server";
    redirect(`${Routes.CreditApplications}/${id}`);
  };
  const [applications, totalNumberOfApplications] = await getCreditApplications(
    props.page,
    props.pageSize,
    props.filters,
    props.sorts,
  );
  const serializedApplications = getSerializedApplications(
    applications,
    userIsGov,
  );
  return (
    <ApplicationsTable
      applications={serializedApplications}
      totalNumberOfApplications={totalNumberOfApplications}
      navigationAction={navigationAction}
      userIsGov={userIsGov}
      headerContent={props.headerContent}
    />
  );
};
