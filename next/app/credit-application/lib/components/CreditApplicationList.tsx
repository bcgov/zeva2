import { redirect } from "next/navigation";
import { getCreditApplications } from "../data";
import { getSerializedApplications } from "../utils";
import { ApplicationsTable } from "./ApplicationsTable";
import { Routes } from "@/app/lib/constants";
import { getUserInfo } from "@/auth";

export const CreditApplicationList = async (props: {
  page: number;
  pageSize: number;
  filters: { [key: string]: string };
  sorts: { [key: string]: string };
}) => {
  const { userIsGov } = await getUserInfo();
  const navigationAction = async (id: number) => {
    "use server";
    redirect(`${Routes.CreditApplication}/${id}`);
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
    />
  );
};
