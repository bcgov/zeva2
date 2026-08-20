"use client";
import { TextInput } from "@/app/lib/components/inputs";
import { OrganizationAddressSparse } from "../data";

type AddressState = [
  OrganizationAddressSparse,
  (address: OrganizationAddressSparse) => void,
];

const AddressField = (props: {
  label: string;
  addressState: AddressState;
  fieldName: keyof OrganizationAddressSparse;
}) => {
  const [address, setAddress] = props.addressState;
  const value = address[props.fieldName] ?? "";
  const handleChange = (value: string) =>
    setAddress({ ...address, [props.fieldName]: value });

  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm">{props.label}</span>
      <TextInput value={value} onChange={handleChange} className="w-full" />
    </div>
  );
};

const AddressEditForm = (props: { addressState: AddressState }) => {
  return (
    <div className="flex w-full flex-col gap-4">
      <AddressField
        label="Representative"
        addressState={props.addressState}
        fieldName="representative"
      />
      <AddressField
        label="Street Address"
        addressState={props.addressState}
        fieldName="addressLines"
      />
      <AddressField
        label="City"
        addressState={props.addressState}
        fieldName="city"
      />
      <AddressField
        label="Province"
        addressState={props.addressState}
        fieldName="state"
      />
      <AddressField
        label="Postal Code"
        addressState={props.addressState}
        fieldName="postalCode"
      />
      <AddressField
        label="Country"
        addressState={props.addressState}
        fieldName="country"
      />
    </div>
  );
};

export default AddressEditForm;
