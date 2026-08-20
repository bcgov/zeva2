import { describe, it, expect } from "@jest/globals";
import {
  getDataActionResponse,
  getErrorActionResponse,
  getSuccessActionResponse,
} from "../actionResponse";

describe("actionResponse utils", () => {
  it("getDataActionResponse wraps data with responseType 'data'", () => {
    expect(getDataActionResponse({ id: 1 })).toEqual({
      responseType: "data",
      data: { id: 1 },
    });
  });

  it("getErrorActionResponse wraps a message with responseType 'error'", () => {
    expect(getErrorActionResponse("boom")).toEqual({
      responseType: "error",
      message: "boom",
    });
  });

  it("getSuccessActionResponse returns responseType 'success'", () => {
    expect(getSuccessActionResponse()).toEqual({ responseType: "success" });
  });
});
