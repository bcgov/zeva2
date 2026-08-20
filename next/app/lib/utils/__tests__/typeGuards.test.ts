import { describe, it, expect } from "@jest/globals";
import {
  isTransactionType,
  isVehicleClass,
  isZevClass,
  isModelYear,
  isNotification,
  isZevType,
  isVehicleStatus,
  isVehicleClassCode,
  isAgreementType,
} from "../typeGuards";

describe("typeGuards", () => {
  it("isTransactionType matches valid keys and rejects invalid ones", () => {
    expect(isTransactionType("A")).toBe(false);
    expect(isTransactionType("not-a-real-value")).toBe(false);
  });

  it("isModelYear matches a valid model year and rejects an invalid one", () => {
    expect(isModelYear("MY_2024")).toBe(true);
    expect(isModelYear("MY_1999")).toBe(false);
  });

  it("isVehicleClass, isZevClass, isNotification, isZevType, isVehicleStatus, isVehicleClassCode, isAgreementType reject unknown strings", () => {
    expect(isVehicleClass("bogus")).toBe(false);
    expect(isZevClass("bogus")).toBe(false);
    expect(isNotification("bogus")).toBe(false);
    expect(isZevType("bogus")).toBe(false);
    expect(isVehicleStatus("bogus")).toBe(false);
    expect(isVehicleClassCode("bogus")).toBe(false);
    expect(isAgreementType("bogus")).toBe(false);
  });

  it("returns false for an empty string", () => {
    expect(isModelYear("")).toBe(false);
  });
});
