import { describe, it, expect } from "@jest/globals";
import { getPageParams } from "../nextPage";

describe("getPageParams", () => {
  it("parses page and pageSize from string params", () => {
    const result = getPageParams(
      { page: "3", pageSize: "50", filters: "a|1", sorts: "b|2" },
      1,
      25,
    );
    expect(result).toEqual({
      page: 3,
      pageSize: 50,
      filters: { a: "1" },
      sorts: { b: "2" },
    });
  });

  it("falls back to defaults when params are undefined", () => {
    const result = getPageParams(undefined, 1, 25);
    expect(result).toEqual({ page: 1, pageSize: 25, filters: {}, sorts: {} });
  });

  it("falls back to defaults when page/pageSize are not valid numbers", () => {
    const result = getPageParams({ page: "abc", pageSize: "" }, 2, 10);
    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(10);
  });
});
