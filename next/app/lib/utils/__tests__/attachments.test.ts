import { describe, it, expect } from "@jest/globals";
import { getDefaultAttchmentTypes } from "../attachments";

describe("getDefaultAttchmentTypes", () => {
  it("returns the expected mime type to extension map", () => {
    const types = getDefaultAttchmentTypes();
    expect(types["application/pdf"]).toEqual([".pdf"]);
    expect(types["image/jpeg"]).toEqual([".jpg", ".jpeg"]);
    expect(types["image/png"]).toEqual([".png"]);
    expect(Object.keys(types)).toHaveLength(7);
  });
});
