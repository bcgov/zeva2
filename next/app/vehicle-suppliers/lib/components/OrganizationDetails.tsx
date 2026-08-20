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
    <div className="w-[455px] flex flex-col border border-disabledIcon rounded">
      <div className="px-5 py-4 bg-disabledSurface font-bold">
        {props.title}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="h-[60px] px-4 py-3 text-left font-bold border-b border-disabledIcon whitespace-nowrap">
                Model Year
              </th>
              <th className="h-[60px] px-4 py-3 text-left font-bold border-b border-disabledIcon whitespace-nowrap">
                Vehicle Class
              </th>
              <th className="h-[60px] px-4 py-3 text-left font-bold border-b border-disabledIcon whitespace-nowrap">
                Volume
              </th>
            </tr>
          </thead>
          <tbody>
            {props.volumes.map((volume, index) => (
              <tr key={index} className="odd:bg-lightGrey even:bg-white">
                <td className="px-4 py-3 border-b border-disabledIcon whitespace-nowrap">
                  {modelYearsMap[volume.modelYear]}
                </td>
                <td className="px-4 py-3 border-b border-disabledIcon whitespace-nowrap">
                  {vehicleClassMap[volume.vehicleClass]}
                </td>
                <td className="px-4 py-3 border-b border-disabledIcon whitespace-nowrap">
                  {volume.volume}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
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
      <div className="flex flex-col gap-6 self-start">
        <div className="flex flex-col border border-dividerMedium rounded">
          <div className="px-5 py-4 text-xl font-bold bg-disabledBG flex justify-between items-center">
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
          </div>
          <div className="p-5 grid grid-cols-2 items-center gap-y-3">
            <div className="font-bold">Common Name:</div>
            <div>{props.shortName ?? "N/A"}</div>
            <hr className="col-span-2 border-disabledBG" />
            <div className="font-bold">Records Address:</div>
            <div>{formattedAddress(props.recordsAddress)}</div>
            <hr className="col-span-2 border-disabledBG" />
            <div className="font-bold">Service Address:</div>
            <div>{formattedAddress(props.serviceAddress)}</div>
            <hr className="col-span-2 border-disabledBG" />
            <div className="font-bold">Class:</div>
            <div>{props.supplierClass}</div>
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        <VolumeTable title="Legacy Sales Volumes" volumes={props.saleVolumes} />
        <VolumeTable title="Supply Volumes" volumes={props.supplyVolumes} />
      </div>
    </div>
  );
};
