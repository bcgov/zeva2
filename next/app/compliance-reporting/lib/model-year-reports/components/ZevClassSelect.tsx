"use client";

import { Fragment } from "react";
import { SupplierZevClassChoice, supplierZevClasses } from "../constants";

export const ZevClassSelect = (props: {
  zevClassSelection: SupplierZevClassChoice;
  handleChange: (zevClass: SupplierZevClassChoice) => void;
  disabled: boolean;
}) => {
  return Object.values(supplierZevClasses).map((zevClass) => {
    return (
      <Fragment key={zevClass}>
        <input
          id={zevClass}
          name="priorityZevClass"
          type="radio"
          value={zevClass}
          checked={props.zevClassSelection === zevClass}
          onChange={() => {
            props.handleChange(zevClass);
          }}
          disabled={props.disabled}
        />
        <label htmlFor={zevClass}>{zevClass}</label>
      </Fragment>
    );
  });
};
