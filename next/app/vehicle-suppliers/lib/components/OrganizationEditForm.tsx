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
    <div className="flex w-full flex-col items-start gap-4">
      <div className="flex w-full items-center justify-between rounded-t-[4px] bg-[#E7E7E7] p-5">
        <div className="flex-1 text-black font-['BC_Sans'] text-[20px] font-bold leading-7">
          {props.formHeading}
        </div>
      </div>
      <div className="flex flex-col items-start gap-6 self-stretch">
        {errorMsg && <p className="text-red-600">{errorMsg}</p>}
        <div className="flex items-stretch gap-6 self-stretch">
          <div className="flex flex-1 flex-col items-start gap-4 rounded-[4px] border border-[#EDEBE9] bg-white p-4">
            <div className="flex items-start gap-4 self-stretch">
              <div className="text-center font-['BC_Sans'] text-[20px] font-bold leading-7 text-[#2D2D2D]">
                Supplier Information
              </div>
            </div>
            <TextInput
              label="Legal Organization Name"
              value={organizationName}
              onChange={setOrganizationName}
              disabled={isPending}
              className="w-full"
            />
            <TextInput
              label="Common Name"
              value={shortName}
              onChange={setShortName}
              disabled={isPending}
              className="w-full"
            />
          </div>
          <div className="flex flex-1 flex-col items-start gap-4">
            <div className="flex flex-1 flex-col items-start justify-center gap-4 self-stretch rounded-[4px] border border-[#EDEBE9] bg-white p-4">
              <div className="flex flex-col items-start gap-4">
                <div className="text-center font-['BC_Sans'] text-[20px] font-bold leading-7 text-[#2D2D2D]">
                  Status
                </div>
              </div>
              <div className="flex flex-col items-start gap-3 self-stretch">
                <SelectionCard
                  variant="radio"
                  name="status"
                  title="Active"
                  description="Supplier can access the system and perform actions based on their assigned role."
                  checked={isActive}
                  onChange={() => setIsActive(true)}
                  accentColor="accent-success"
                  titleColor="text-success"
                  hoverBorderColor="hover:border-primaryBlue"
                  className="self-stretch"
                  disabled={isPending}
                />
                <SelectionCard
                  variant="radio"
                  name="status"
                  title="Inactive"
                  description="This will deactivate the supplier's account."
                  checked={!isActive}
                  onChange={() => setIsActive(false)}
                  accentColor="accent-danger"
                  titleColor="text-danger"
                  hoverBorderColor="hover:border-primaryBlue"
                  className="self-stretch"
                  disabled={isPending}
                />
              </div>
            </div>
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
    </div>
  );
};

export default OrganizationEditForm;
