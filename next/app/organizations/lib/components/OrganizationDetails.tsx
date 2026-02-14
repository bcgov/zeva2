"use client";
import {
  $Enums,
  ModelYear,
  Vehicle,
  VehicleClass,
} from "@/prisma/generated/client";
import { enumToTitleString } from "@/lib/utils/convertEnums";
import { Button } from "@/app/lib/components";
import { useState } from "react";
import OrganizationEditForm from "./OrganizationEditForm";
import { OrganizationPayload } from "../action";
import { OrganizationAddressSparse } from "../data";
import {
  getModelYearEnumsToStringsMap,
  getVehicleClassEnumsToStringsMap,
} from "@/app/lib/utils/enumMaps";

type OrganizationUser = {
  id: number;
  firstName: string;
  lastName: string;
  roles: $Enums.Role[];
};

const formattedAddress = (address: OrganizationAddressSparse | undefined) => {
  if (!address) return <span>N/A</span>;
  const { addressLines, city, state, postalCode, country, representative } =
    address;
  return (
    <div>
      {representative && <p>{representative}</p>}
      {addressLines &&
        addressLines
          .split("\n")
          .map((line, index) => <p key={index}>{line}</p>)}
      {(city || state || postalCode) && (
        <p>
          {city}, {state} {postalCode}
        </p>
      )}
      {country && <p>{country}</p>}
    </div>
  );
};

const organizationUsers = (users: OrganizationUser[]) => {
  if (users.length === 0) {
    return <span>N/A</span>;
  }
  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>
          <a
            href={`/users/${user.id}`}
            className="text-primaryBlue hover:underline"
          >
            {user.firstName} {user.lastName} [
            {user.roles.map((role) => enumToTitleString(role)).join(" | ")}]
          </a>
        </li>
      ))}
    </ul>
  );
};

type Volume = {
  vehicleClass: VehicleClass;
  modelYear: ModelYear;
  volume: number;
};

const OrganizationDetails = (props: {
  organizationName: string;
  shortName?: string;
  isActive: boolean;
  serviceAddress?: OrganizationAddressSparse;
  recordsAddress?: OrganizationAddressSparse;
  supplierClass: string;
  saleVolumes: Volume[];
  supplyVolumes: Volume[];
  users: OrganizationUser[];
  update?: (data: OrganizationPayload) => Promise<void>;
}) => {
  const [mode, setMode] = useState<"view" | "edit">("view");

  if (mode === "edit") {
    return (
      <OrganizationEditForm
        formHeading="Edit Vehicle Supplier"
        submitButtonText="Save"
        organizationName={props.organizationName}
        shortName={props.shortName}
        isActive={props.isActive}
        serviceAddress={props.serviceAddress}
        recordsAddress={props.recordsAddress}
        upsertData={props.update ?? (() => Promise.resolve())}
        handleCancel={() => setMode("view")}
      />
    );
  }

  const vehicleClassMap = getVehicleClassEnumsToStringsMap();
  const modelYearsMap = getModelYearEnumsToStringsMap();

  return (
    <div className="space-y-4">
      <div className="flex flex-row gap-8">
        <h2 className="text-xl font-semibold text-primaryBlue py-1">
          {props.organizationName}
        </h2>
        {props.update && (
          <Button variant="secondary" onClick={() => setMode("edit")}>
            Edit
          </Button>
        )}
      </div>

      <div>
        <span className="font-semibold mr-2">Common Name:</span>
        {props.shortName ?? "N/A"}
      </div>

      <div className="flex flex-row">
        <div className="w-1/3">
          <h3 className="font-semibold">Service Address</h3>
          {formattedAddress(props.serviceAddress)}
        </div>
        <div className="w-1/3">
          <h3 className="font-semibold">Records Address</h3>
          {formattedAddress(props.recordsAddress)}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mr-2">User(s):</h3>
        {organizationUsers(props.users)}
      </div>

      <div>
        <span className="font-semibold mr-2">Class:</span>
        {props.supplierClass}
      </div>

      <div className="flex flex-row">
        <div className="w-1/3">
          <h3 className="font-semibold">Legacy Sales Volumes</h3>
          <table>
            <thead>
              <tr>
                <th className="border border-gray-300">Vehicle Class</th>
                <th className="border border-gray-300">Model Year</th>
                <th className="border border-gray-300">Volume</th>
              </tr>
            </thead>
            <tbody>
              {props.saleVolumes.map((volume, index) => (
                <tr key={index}>
                  <td className="border border-gray-300">
                    {vehicleClassMap[volume.vehicleClass]}
                  </td>
                  <td className="border border-gray-300">
                    {modelYearsMap[volume.modelYear]}
                  </td>
                  <td className="border border-gray-300">{volume.volume}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="w-1/3">
          <h3 className="font-semibold">Supply Volumes</h3>
          <table>
            <thead>
              <tr>
                <th className="border border-gray-300">Vehicle Class</th>
                <th className="border border-gray-300">Model Year</th>
                <th className="border border-gray-300">Volume</th>
              </tr>
            </thead>
            <tbody>
              {props.supplyVolumes.map((volume, index) => (
                <tr key={index}>
                  <td className="border border-gray-300">
                    {vehicleClassMap[volume.vehicleClass]}
                  </td>
                  <td className="border border-gray-300">
                    {modelYearsMap[volume.modelYear]}
                  </td>
                  <td className="border border-gray-300">{volume.volume}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OrganizationDetails;
