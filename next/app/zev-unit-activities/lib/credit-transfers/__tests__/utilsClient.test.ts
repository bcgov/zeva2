import { describe, it, expect } from "@jest/globals";
import { getCreditTransferPayload } from "../utilsClient";

describe("getCreditTransferPayload", () => {
  const validLine = {
    vehicleClass: "REPORTABLE",
    zevClass: "A",
    modelYear: "MY_2024",
    numberOfUnits: "10",
    dollarValuePerUnit: "5.5",
  };

  it("builds a payload from valid transfer-to id and lines", () => {
    const payload = getCreditTransferPayload("5", [validLine]);
    expect(payload).toEqual({
      transferToId: 5,
      transferContent: [
        {
          vehicleClass: "REPORTABLE",
          zevClass: "A",
          modelYear: "MY_2024",
          numberOfUnits: "10",
          dollarValuePerUnit: "5.5",
        },
      ],
    });
  });

  it("throws if transferTo is not a valid integer", () => {
    expect(() => getCreditTransferPayload("abc", [validLine])).toThrow(
      "Invalid Transfer Partner!",
    );
    expect(() => getCreditTransferPayload("1.5", [validLine])).toThrow(
      "Invalid Transfer Partner!",
    );
  });

  it("throws if there are no transfer lines", () => {
    expect(() => getCreditTransferPayload("5", [])).toThrow(
      "No transfer content!",
    );
  });

  it("throws if a transfer line is missing a required field", () => {
    const { vehicleClass, ...missingVehicleClass } = validLine;
    expect(() => getCreditTransferPayload("5", [missingVehicleClass])).toThrow(
      "Invalid value detected!",
    );
  });

  it("throws if a transfer line has an invalid enum value", () => {
    expect(() =>
      getCreditTransferPayload("5", [{ ...validLine, zevClass: "bogus" }]),
    ).toThrow("Invalid value detected!");
  });

  it("throws if numberOfUnits or dollarValuePerUnit are not positive or exceed 2 decimal places", () => {
    expect(() =>
      getCreditTransferPayload("5", [{ ...validLine, numberOfUnits: "0" }]),
    ).toThrow(
      "Number of Units and Dollar Value per Unit must be positive numbers rounded to 2 decimal places or less!",
    );
    expect(() =>
      getCreditTransferPayload("5", [
        { ...validLine, numberOfUnits: "10.123" },
      ]),
    ).toThrow(
      "Number of Units and Dollar Value per Unit must be positive numbers rounded to 2 decimal places or less!",
    );
  });
});
