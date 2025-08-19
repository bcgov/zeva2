"use client";
import { $Enums } from "@/prisma/generated/client";
import { enumToTitleString } from "@/lib/utils/convertEnums";
import { Button } from "@/app/lib/components";
import { useState } from "react";
import OrganizationEditForm from "./OrganizationEditForm";
import { OrganizationPayload } from "../action";
import { OrganizationAddressSparse } from "../data";

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

const OrganizationDetails = (props: {
  organizationName: string;
  shortName?: string;
  isActive: boolean;
  firstModelYear: string;
  serviceAddress?: OrganizationAddressSparse;
  recordsAddress?: OrganizationAddressSparse;
  supplierClass: string;
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

  return (
    <div className="space-y-4">
      <div className="flex flex-row gap-8">
        <h2 className="text-xl font-semibold text-primaryBlue py-1">
          {props.organizationName}
        </h2>
        {props.update && (
          <Button className="py-1 w-16" onClick={() => setMode("edit")}>
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
        <span className="font-semibold mr-2">Vehicle Supplier Class:</span>
        {props.supplierClass}
      </div>

      <div>
        <span className="font-semibold mr-2">First Model Year Report:</span>
        {props.firstModelYear}
      </div>

      <div>
        <h3 className="font-semibold mr-2">User(s):</h3>
        {organizationUsers(props.users)}
      </div>
    </div>
  );
};

export default OrganizationDetails;
