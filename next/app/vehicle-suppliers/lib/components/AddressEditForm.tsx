"use client";
import { TextInput, Textarea } from "@/app/lib/components/inputs";
import { OrganizationAddressSparse } from "../data";

const fieldMainClass = "grid grid-cols-[120px_1fr]";

type AddressState = [
  OrganizationAddressSparse,
  (address: OrganizationAddressSparse) => void,
];

const AddressField = (props: {
  addressState: AddressState;
  fieldName: keyof OrganizationAddressSparse;
  multiline?: boolean;
}) => {
  const [address, setAddress] = props.addressState;
  const value = address[props.fieldName] ?? "";
  const handleChange = (value: string) =>
    setAddress({
      ...address,
      [props.fieldName]: value,
    });

  return props.multiline ? (
    <Textarea rows={3} value={value} onChange={handleChange} />
  ) : (
    <TextInput value={value} onChange={handleChange} />
  );
};

const AddressEditForm = (props: { addressState: AddressState }) => {
  return (
    <div className="space-y-2">
      <div className={fieldMainClass}>
        <span className="mb-1">Representative</span>
        <AddressField
          addressState={props.addressState}
          fieldName="representative"
        />
      </div>
      <div className={fieldMainClass}>
        <span className="mb-1">Street Address</span>
        <AddressField
          addressState={props.addressState}
          fieldName="addressLines"
          multiline={true}
        />
      </div>
      <div className={fieldMainClass}>
        <span className="mb-1">City</span>
        <AddressField addressState={props.addressState} fieldName="city" />
      </div>
      <div className={fieldMainClass}>
        <span className="mb-1">Province/State</span>
        <AddressField addressState={props.addressState} fieldName="state" />
      </div>
      <div className={fieldMainClass}>
        <span className="mb-1">Postal Code</span>
        <AddressField
          addressState={props.addressState}
          fieldName="postalCode"
        />
      </div>
      <div className={fieldMainClass}>
        <span className="mb-1">Country</span>
        <AddressField addressState={props.addressState} fieldName="country" />
      </div>
    </div>
  );
};

export default AddressEditForm;
