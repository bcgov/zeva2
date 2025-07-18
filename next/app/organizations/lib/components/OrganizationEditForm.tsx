"use client";
import { FormEvent, useState } from "react";
import { Button } from "@/app/lib/components";
import { OrganizationPayload } from "../action";
import AddressEditForm from "./AddressEditForm";
import { OrganizationAddressSparse } from "../data";
import { cleanupAddressData } from "../utils";
import { cleanupStringData } from "@/lib/utils/dataCleanup";

const mainFieldClass = "grid grid-cols-[220px_1fr]";
const addressFrameClass = "w-1/2 border border-borderGrey p-2";
const addressHeadingClass = "text-lg font-semibold text-primaryBlue pb-4";

const OrganizationEditForm = (props: {
  formHeading: string;
  submitButtonText: string;
  organizationName?: string;
  shortName?: string;
  isActive: boolean;
  serviceAddress?: OrganizationAddressSparse;
  recordsAddress?: OrganizationAddressSparse;
  upsertData: (data: OrganizationPayload) => Promise<void>;
  handleCancel: () => void;
}) => {
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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const orgName = cleanupStringData(organizationName);
    const shortOrgName = cleanupStringData(shortName);
    if (!orgName || !shortOrgName) {
      setErrorMsg("Both the organization name and the common name are required.");
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
    await props.upsertData(data);
    window.location.reload(); // Reload to reflect changes if not redirected
  };

  return (
    <>
      <h2 className="text-xl font-semibold text-primaryBlue pb-4">
        {props.formHeading}
      </h2>

      <form className="space-y-4" onSubmit={handleSubmit}>
        {errorMsg && <p className="text-red-600">{errorMsg}</p>}
        <div className={mainFieldClass}>
          <span className="p-1">Legal Organization Name</span>
          <input
            className="p-1"
            type="text"
            required
            value={organizationName}
            onChange={(e) => setOrganizationName(e.target.value)}
          />
        </div>

        <div className={mainFieldClass}>
          <span className="p-1">Common Name</span>
          <input
            className="p-1"
            type="text"
            required
            value={shortName}
            onChange={(e) => setShortName(e.target.value)}
          />
        </div>
        <div className={mainFieldClass + " p-1"}>
          <span>Status</span>
          <div className="flex flex-row gap-12">
            <label>
              <input
                className="mr-2"
                type="radio"
                value="true"
                checked={isActive}
                onChange={() => setIsActive(true)}
              />
              Active
            </label>
            <label>
              <input
                className="mr-2"
                type="radio"
                value="false"
                checked={!isActive}
                onChange={() => setIsActive(false)}
              />
              Inactive
            </label>
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
          <Button className="py-1 w-16" type="submit">
            {props.submitButtonText}
          </Button>
          <Button
            className="bg-white border border-primaryBlue text-primaryBlue py-1 w-16"
            type="button"
            onClick={props.handleCancel}
          >
            Cancel
          </Button>
        </div>
      </form>
    </>
  );
};

export default OrganizationEditForm;
