import React from "react";
import { redirect } from "next/navigation";
import { Routes } from "@/app/lib/constants";
import { getOrganizations } from "../data";
import { OrganizationTable } from "./OrganizationTable";

export const OrganizationList = async (props: {
  page: number;
  pageSize: number;
  filters: { [key: string]: string };
  sorts: { [key: string]: string };
}) => {
  const navigationAction = async (id: number) => {
    "use server";
    redirect(`${Routes.VehicleSuppliers}/${id}`);
  };
  const [organizations, totalNumberOfOrganizations] = await getOrganizations(
    props.page,
    props.pageSize,
    props.filters,
    props.sorts,
  );

  return (
    <OrganizationTable
      organizations={organizations}
      totalNumberOfOrganizations={totalNumberOfOrganizations}
      navigationAction={navigationAction}
    />
  );
};