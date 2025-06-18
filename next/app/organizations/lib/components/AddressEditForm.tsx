"use client";
import { OrganizationAddressSparse } from "../data";

const fieldMainClass = "grid grid-cols-[120px_1fr]";
const textboxClass = "p-1 border border-gray-300 rounded";

type AddressState = [
  OrganizationAddressSparse,
  (address: OrganizationAddressSparse) => void
];

const AddressField = (props: {
  addressState: AddressState,
  fieldName: keyof OrganizationAddressSparse,
  multiline?: boolean;
}) => {
  const [address, setAddress] = props.addressState;
  const value = address[props.fieldName] || "";
  const handleChange = (value: string) => setAddress({
    ...address,
    [props.fieldName]: value
  });

  return props.multiline ? (
    <textarea
      className={textboxClass}
      rows={3}
      value={value}
      onChange={(e) => handleChange(e.target.value)}
    />
  ) : (
    <input
      className={textboxClass}
      type="text"
      value={value}
      onChange={(e) => handleChange(e.target.value)}
    />
  );
};

const AddressEditForm = (props: {
  addressState: AddressState,
}) => {
  return (
    <div className="space-y-2">
      <div className={fieldMainClass}>
        <label className="mb-1">Representative</label>
        <AddressField
          addressState={props.addressState}
          fieldName="representative"
        />
      </div>
      <div className={fieldMainClass}>
        <label className="mb-1">Street Address</label>
        <AddressField
          addressState={props.addressState}
          fieldName="addressLines"
          multiline={true}
        />
      </div>
      <div className={fieldMainClass}>
        <label className="mb-1">City</label>
        <AddressField
          addressState={props.addressState}
          fieldName="city"
        />
      </div>
      <div className={fieldMainClass}>
        <label className="mb-1">Province/State</label>
        <AddressField
          addressState={props.addressState}
          fieldName="state"
        />
      </div>
      <div className={fieldMainClass}>
        <label className="mb-1">Postal Code</label>
        <AddressField
          addressState={props.addressState}
          fieldName="postalCode"
        />
      </div>
      <div className={fieldMainClass}>
        <label className="mb-1">Country</label>
        <AddressField
          addressState={props.addressState}
          fieldName="country"
        />
      </div>
    </div>
  );
};

export default AddressEditForm;
