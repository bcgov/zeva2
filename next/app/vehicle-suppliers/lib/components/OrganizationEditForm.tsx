"use client";

import { useCallback, useState, useTransition } from "react";
import { Button } from "@/app/lib/components";
import { SelectionCard, TextInput } from "@/app/lib/components/inputs";
import {
  createOrganization,
  OrganizationPayload,
  saveOrganization,
} from "../actions";
import AddressEditForm from "./AddressEditForm";
import { OrganizationAddressSparse } from "../data";
import { cleanupAddressData } from "../utils";
import { cleanupStringData } from "@/lib/utils/dataCleanup";
import { useRouter } from "next/navigation";
import { Routes } from "@/app/lib/constants";

const mainFieldClass = "grid grid-cols-[220px_1fr]";
const addressFrameClass = "w-1/2 border border-borderGrey p-2";
const addressHeadingClass = "text-lg font-semibold text-primaryBlue pb-4";

const OrganizationEditForm = (props: {
  orgId?: number;
  formHeading: string;
  submitButtonText: string;
  organizationName?: string;
  shortName?: string;
  isActive: boolean;
  serviceAddress?: OrganizationAddressSparse;
  recordsAddress?: OrganizationAddressSparse;
  handleCancel: () => void;
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [organizationName, setOrganizationName] = useState(
    props.organizationName ?? "",
  );
  const [shortName, setShortName] = useState(props.shortName ?? "");
  const [isActive, setIsActive] = useState(props.isActive);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const emptyAddress: OrganizationAddressSparse = {
    addressLines: "",
    city: "",
    state: "",
    postalCode: "",
    county: "",
    country: "",
    representative: "",
  };
  const serviceAddressState = useState(
    props.serviceAddress ?? {
      ...emptyAddress,
    },
  );
  const [serviceAddress] = serviceAddressState;
  const recordsAddressState = useState(
    props.recordsAddress ?? {
      ...emptyAddress,
    },
  );
  const [recordsAddress] = recordsAddressState;

  const handleSubmit = useCallback(() => {
    setErrorMsg("");
    startTransition(async () => {
      const orgName = cleanupStringData(organizationName);
      const shortOrgName = cleanupStringData(shortName);
      if (!orgName || !shortOrgName) {
        setErrorMsg(
          "Both the organization name and the common name are required.",
        );
        return;
      }
      const data: OrganizationPayload = {
        name: orgName,
        shortName: shortOrgName,
        isActive,
        isGovernment: false,
        serviceAddress: cleanupAddressData(serviceAddress),
        recordsAddress: cleanupAddressData(recordsAddress),
      };
      if (props.orgId) {
        const orgUpdated = await saveOrganization(props.orgId, data);
        if (orgUpdated) {
          window.location.reload();
        }
      } else {
        const newOrg = await createOrganization(data);
        if (newOrg) {
          router.push(`${Routes.VehicleSuppliers}/${newOrg.id}/supplier-info`);
        }
      }
    });
  }, [
    props.orgId,
    organizationName,
    shortName,
    isActive,
    serviceAddress,
    recordsAddress,
  ]);

  return (
    <>
      <h2 className="text-xl font-semibold text-primaryBlue pb-4">
        {props.formHeading}
      </h2>

      <div className="space-y-4">
        {errorMsg && <p className="text-red-600">{errorMsg}</p>}
        <TextInput
          label="Legal Organization Name"
          value={organizationName}
          onChange={setOrganizationName}
          disabled={isPending}
        />

        <TextInput
          label="Common Name"
          value={shortName}
          onChange={setShortName}
          disabled={isPending}
        />
        <div className={mainFieldClass + " items-center p-1"}>
          <span className="font-medium text-primaryText">Status</span>
          <div className="flex flex-row gap-3">
            <SelectionCard
              variant="radio"
              name="status"
              title="Active"
              checked={isActive}
              onChange={() => setIsActive(true)}
              accentColor="accent-success"
              titleColor="text-success"
              hoverBorderColor="hover:border-primaryBlue"
              className="flex-1 max-w-[200px]"
              disabled={isPending}
            />
            <SelectionCard
              variant="radio"
              name="status"
              title="Inactive"
              checked={!isActive}
              onChange={() => setIsActive(false)}
              accentColor="accent-danger"
              titleColor="text-danger"
              hoverBorderColor="hover:border-primaryBlue"
              className="flex-1 max-w-[200px]"
              disabled={isPending}
            />
          </div>
        </div>

        <div className="flex flex-row gap-4">
          <div className={addressFrameClass}>
            <h3 className={addressHeadingClass}>Service Address</h3>
            <AddressEditForm addressState={serviceAddressState} />
          </div>
          <div className={addressFrameClass}>
            <h3 className={addressHeadingClass}>Records Address</h3>
            <AddressEditForm addressState={recordsAddressState} />
          </div>
        </div>

        <div className="flex flex-row gap-12 my-2">
          <Button variant="primary" onClick={handleSubmit} disabled={isPending}>
            {props.submitButtonText}
          </Button>
          <Button
            variant="secondary"
            type="button"
            onClick={props.handleCancel}
            disabled={isPending}
          >
            Cancel
          </Button>
        </div>
      </div>
    </>
  );
};

export default OrganizationEditForm;
