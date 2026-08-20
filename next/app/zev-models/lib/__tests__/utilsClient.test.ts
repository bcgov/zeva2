import { describe, it, expect } from "@jest/globals";
import { getVehiclePayload, gvwrCheck, rangeCheck } from "../utilsClient";
import { VehicleFormData } from "../components/VehicleForm";

describe("gvwrCheck", () => {
  it("accepts a positive integer up to 4536", () => {
    expect(() => gvwrCheck("4536")).not.toThrow();
    expect(() => gvwrCheck("1")).not.toThrow();
  });

  it("rejects non-integers, zero, negatives, and values over 4536", () => {
    expect(() => gvwrCheck("1.5")).toThrow("Invalid GVWR!");
    expect(() => gvwrCheck("0")).toThrow("Invalid GVWR!");
    expect(() => gvwrCheck("-1")).toThrow("Invalid GVWR!");
    expect(() => gvwrCheck("4537")).toThrow("Invalid GVWR!");
  });
});

describe("rangeCheck", () => {
  it("accepts a positive integer", () => {
    expect(() => rangeCheck("100")).not.toThrow();
  });

  it("rejects non-integers and non-positive values", () => {
    expect(() => rangeCheck("100.5")).toThrow("Invalid Electric EPA Range!");
    expect(() => rangeCheck("0")).toThrow("Invalid Electric EPA Range!");
    expect(() => rangeCheck("-5")).toThrow("Invalid Electric EPA Range!");
  });
});

describe("getVehiclePayload", () => {
  const validData: VehicleFormData = {
    modelYear: "MY_2024",
    make: "Test Make",
    modelName: "Test Model",
    zevType: "BEV",
    bodyType: "Compact",
    range: "200",
    gvwr: "2000",
    us06: "true",
  } as VehicleFormData;

  it("builds a payload from valid form data", () => {
    const payload = getVehiclePayload(validData);
    expect(payload).toEqual({
      modelYear: "MY_2024",
      make: "Test Make",
      modelName: "Test Model",
      us06RangeGte16: true,
      range: 200,
      vehicleClassCode: "COMPACT",
      zevType: "BEV",
      weight: 2000,
    });
  });

  it("throws if any required field is missing", () => {
    expect(() =>
      getVehiclePayload({ ...validData, make: "" } as VehicleFormData),
    ).toThrow("All fields are required!");
  });

  it("throws for an invalid or too-early model year", () => {
    expect(() =>
      getVehiclePayload({
        ...validData,
        modelYear: "not-a-year",
      } as VehicleFormData),
    ).toThrow("Invalid Model Year!");
    expect(() =>
      getVehiclePayload({
        ...validData,
        modelYear: "MY_2018",
      } as VehicleFormData),
    ).toThrow("Invalid Model Year!");
  });

  it("throws for an invalid zev type", () => {
    expect(() =>
      getVehiclePayload({ ...validData, zevType: "bogus" } as VehicleFormData),
    ).toThrow("Invalid ZEV Type!");
  });

  it("throws for an unrecognized body type", () => {
    expect(() =>
      getVehiclePayload({ ...validData, bodyType: "bogus" } as VehicleFormData),
    ).toThrow("Invalid Body type!");
  });

  it("sets us06RangeGte16 to false when us06 is not 'true'", () => {
    const payload = getVehiclePayload({
      ...validData,
      us06: "false",
    } as VehicleFormData);
    expect(payload.us06RangeGte16).toBe(false);
  });
});
