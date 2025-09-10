import { getCreditTransferPayload } from "../utilsClient";
import { Decimal } from "@/prisma/generated/client/runtime/index-browser";

describe("utilsClient.getCreditTransferPayload", () => {
  test("throws on invalid transferTo", () => {
    expect(() => getCreditTransferPayload("1.5", [])).toThrow(/Invalid Transfer Partner/i);
  });

  test("throws on empty lines", () => {
    expect(() => getCreditTransferPayload("2", [])).toThrow(/No transfer content/i);
  });

  test("throws on invalid line values and decimals", () => {
    expect(() =>
      getCreditTransferPayload("2", [{ vehicleClass: "X" } as any]),
    ).toThrow(/Invalid value/i);

    expect(() =>
      getCreditTransferPayload("2", [
        {
          vehicleClass: "REPORTABLE",
          zevClass: "A",
          modelYear: "MY_2024",
          numberOfUnits: "-1",
          dollarValuePerUnit: "1.234",
        } as any,
      ]),
    ).toThrow(/Number of Units and Dollar Value per Unit/i);
  });

  test("returns normalized payload for valid lines", () => {
    const payload = getCreditTransferPayload("2", [
      {
        vehicleClass: "REPORTABLE",
        zevClass: "A",
        modelYear: "MY_2024",
        numberOfUnits: "10",
        dollarValuePerUnit: "3.5",
      } as any,
    ]);
    expect(payload.transferToId).toBe(2);
    expect(payload.transferContent[0].numberOfUnits).toBe(new (Decimal as any)("10").toString());
  });
});

