import { describe, it, expect } from "@jest/globals";
import { getPenaltyCreditPayload } from "../utilsClient";

describe("getPenaltyCreditPayload", () => {
  const validData = {
    organizationId: "42",
    complianceYear: "MY_2024",
    vehicleClass: "REPORTABLE",
    zevClass: "A",
    modelYear: "MY_2024",
    numberOfUnits: "10",
  };

  it("builds a payload from valid data", () => {
    expect(getPenaltyCreditPayload(validData)).toEqual({
      organizationId: 42,
      complianceYear: "MY_2024",
      vehicleClass: "REPORTABLE",
      zevClass: "A",
      modelYear: "MY_2024",
      numberOfUnits: "10",
    });
  });

  it("throws if any required field is missing", () => {
    const { organizationId, ...missingOrgId } = validData;
    expect(() => getPenaltyCreditPayload(missingOrgId)).toThrow(
      "All fields are required!",
    );
  });

  it("throws if organizationId is not a valid integer", () => {
    expect(() =>
      getPenaltyCreditPayload({ ...validData, organizationId: "abc" }),
    ).toThrow("Invalid Input Detected!");
  });

  it("throws if an enum field is invalid", () => {
    expect(() =>
      getPenaltyCreditPayload({ ...validData, vehicleClass: "bogus" }),
    ).toThrow("Invalid Input Detected!");
    expect(() =>
      getPenaltyCreditPayload({ ...validData, zevClass: "bogus" }),
    ).toThrow("Invalid Input Detected!");
    expect(() =>
      getPenaltyCreditPayload({ ...validData, modelYear: "bogus" }),
    ).toThrow("Invalid Input Detected!");
  });

  it("throws if numberOfUnits is not positive or exceeds 2 decimal places", () => {
    expect(() =>
      getPenaltyCreditPayload({ ...validData, numberOfUnits: "0" }),
    ).toThrow(
      "Invalid Number of Units; Number of Units must be a positive number with no more than 2 decimal places!",
    );
    expect(() =>
      getPenaltyCreditPayload({ ...validData, numberOfUnits: "10.123" }),
    ).toThrow(
      "Invalid Number of Units; Number of Units must be a positive number with no more than 2 decimal places!",
    );
  });
});
