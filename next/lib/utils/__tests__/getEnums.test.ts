import { getAddressTypeEnum } from "../getEnums";
import { AddressType } from "@/prisma/generated/client";

describe("getEnums", () => {
  test("getAddressTypeEnum handles case-insensitive valid values", () => {
    expect(getAddressTypeEnum("mailing")).toBe(AddressType.MAILING);
    expect(getAddressTypeEnum("HEAD_OFFICE")).toBe(AddressType.HEAD_OFFICE);
  });

  test("getAddressTypeEnum throws on invalid value", () => {
    expect(() => getAddressTypeEnum("unknown" as any)).toThrow(
      /Invalid address type/i,
    );
  });
});

