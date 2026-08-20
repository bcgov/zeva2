import { describe, it, expect } from "@jest/globals";
import { contentIsValid } from "../utilsClient";
import { AgreementContentRecord } from "../constants";

describe("contentIsValid", () => {
  const validRecord: AgreementContentRecord = {
    vehicleClass: "REPORTABLE",
    zevClass: "A",
    modelYear: "MY_2024",
    numberOfUnits: "10",
  } as AgreementContentRecord;

  it("returns true when all records are valid", () => {
    expect(contentIsValid([validRecord])).toBe(true);
  });

  it("returns true for an empty content list", () => {
    expect(contentIsValid([])).toBe(true);
  });

  it("returns false if a record is missing vehicleClass, zevClass, or modelYear", () => {
    expect(contentIsValid([{ ...validRecord, vehicleClass: "" }])).toBe(false);
    expect(contentIsValid([{ ...validRecord, zevClass: "" }])).toBe(false);
    expect(contentIsValid([{ ...validRecord, modelYear: "" }])).toBe(false);
  });

  it("returns false if numberOfUnits is not a positive number with at most 2 decimal places", () => {
    expect(contentIsValid([{ ...validRecord, numberOfUnits: "0" }])).toBe(
      false,
    );
    expect(contentIsValid([{ ...validRecord, numberOfUnits: "-1" }])).toBe(
      false,
    );
    expect(contentIsValid([{ ...validRecord, numberOfUnits: "10.123" }])).toBe(
      false,
    );
    expect(
      contentIsValid([{ ...validRecord, numberOfUnits: "not-a-number" }]),
    ).toBe(false);
  });

  it("returns false if any record in a list is invalid", () => {
    expect(
      contentIsValid([validRecord, { ...validRecord, numberOfUnits: "0" }]),
    ).toBe(false);
  });
});
