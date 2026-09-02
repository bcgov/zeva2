"use client";

import { ModelYear, VehicleClass } from "@/prisma/generated/enums";
import { Button } from "@/app/lib/components";
import { useState } from "react";
import OrganizationEditForm from "./OrganizationEditForm";
import { OrganizationAddressSparse } from "../data";
import {
  getModelYearEnumsToStringsMap,
  getVehicleClassEnumsToStringsMap,
} from "@/app/lib/utils/enumMaps";

const formattedAddress = (address: OrganizationAddressSparse | undefined) => {
  if (!address) return <span>N/A</span>;
  const { addressLines, city, state, postalCode, country } = address;
  const parts = [addressLines, city, state, postalCode, country].filter(
    Boolean,
  );
  if (parts.length === 0) return <span>N/A</span>;
  return <span>{parts.join(", ")}</span>;
};

type Volume = {
  vehicleClass: VehicleClass;
  modelYear: ModelYear;
  volume: number;
};

const VolumeTable = (props: { title: string; volumes: Volume[] }) => {
  const vehicleClassMap = getVehicleClassEnumsToStringsMap();
  const modelYearsMap = getModelYearEnumsToStringsMap();

  return (
    <section className="min-w-0 overflow-hidden rounded border border-dividerMedium bg-white">
      <h2 className="bg-disabledSurface px-5 py-4 font-bold">{props.title}</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] border-collapse text-sm">
          <thead>
            <tr>
              <th
                scope="col"
                className="h-[60px] w-1/3 whitespace-nowrap border-b border-dividerMedium px-4 py-3 text-left font-bold"
              >
                Model Year
              </th>
              <th
                scope="col"
                className="h-[60px] w-1/3 whitespace-nowrap border-b border-dividerMedium px-4 py-3 text-left font-bold"
              >
                Vehicle Class
              </th>
              <th
                scope="col"
                className="h-[60px] w-1/3 whitespace-nowrap border-b border-dividerMedium px-4 py-3 text-left font-bold"
              >
                Volume
              </th>
            </tr>
          </thead>
          <tbody>
            {props.volumes.map((volume, index) => (
              <tr
                key={index}
                className="odd:bg-lightGrey even:bg-white [&:last-child_td]:border-b-0"
              >
                <td className="h-[60px] whitespace-nowrap border-b border-dividerMedium px-4 py-3">
                  {modelYearsMap[volume.modelYear]}
                </td>
                <td className="h-[60px] whitespace-nowrap border-b border-dividerMedium px-4 py-3">
                  {vehicleClassMap[volume.vehicleClass]}
                </td>
                <td className="h-[60px] whitespace-nowrap border-b border-dividerMedium px-4 py-3">
                  {volume.volume}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export const OrganizationDetails = (props: {
  orgId: number;
  userIsGov: boolean;
  organizationName: string;
  shortName?: string;
  isActive: boolean;
  serviceAddress?: OrganizationAddressSparse;
  recordsAddress?: OrganizationAddressSparse;
  supplierClass: string;
  saleVolumes: Volume[];
  supplyVolumes: Volume[];
  canEdit: boolean;
}) => {
  const [mode, setMode] = useState<"view" | "edit">("view");

  if (mode === "edit") {
    return (
      <OrganizationEditForm
        orgId={props.orgId}
        formHeading="Edit Supplier Information"
        submitButtonText="Save"
        organizationName={props.organizationName}
        shortName={props.shortName}
        isActive={props.isActive}
        serviceAddress={props.serviceAddress}
        recordsAddress={props.recordsAddress}
        handleCancel={() => setMode("view")}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="w-full max-w-3xl overflow-hidden rounded border border-dividerMedium bg-white">
        <h2 className="flex min-h-[60px] items-center justify-between gap-4 bg-disabledSurface px-5 py-4 text-xl font-bold">
          Supplier Information
          {props.canEdit && (
            <Button
              variant="secondary"
              size="small"
              onClick={() => setMode("edit")}
            >
              Edit
            </Button>
          )}
        </h2>
        <div className="grid grid-cols-1 items-center gap-y-3 p-5 sm:grid-cols-[230px_minmax(0,1fr)]">
          <div className="font-bold">Common Name:</div>
          <div>{props.shortName ?? "N/A"}</div>
          <hr className="col-span-full w-full border-disabledBG" />
          <div className="font-bold">Records Address:</div>
          <div className="min-w-0">
            {formattedAddress(props.recordsAddress)}
          </div>
          <hr className="col-span-full w-full border-disabledBG" />
          <div className="font-bold">Service Address:</div>
          <div className="min-w-0">
            {formattedAddress(props.serviceAddress)}
          </div>
          <hr className="col-span-full w-full border-disabledBG" />
          <div className="font-bold">Class:</div>
          <div>{props.supplierClass}</div>
        </div>
      </section>

      <div className="grid w-full max-w-6xl grid-cols-1 gap-6 lg:grid-cols-2">
        <VolumeTable title="Legacy Sales Volumes" volumes={props.saleVolumes} />
        <VolumeTable title="Supply Volumes" volumes={props.supplyVolumes} />
      </div>
    </div>
  );
};
