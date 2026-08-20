import { describe, it, expect } from "@jest/globals";
import {
  getWhereClause,
  getOrderByClause,
  getRecordsWhereClause,
  getRecordsOrderByClause,
  getSerializedRecords,
  getSerializedApplications,
} from "../utilsServer";
import {
  CreditApplicationRecordSparse,
  CreditApplicationSparse,
} from "../constants";

describe("getWhereClause", () => {
  it("parses an id filter as an integer", () => {
    expect(getWhereClause({ id: "42" }, true)).toEqual({ id: 42 });
  });

  it("maps status filters to CreditApplicationStatus for gov users", () => {
    const result = getWhereClause({ status: "Submitted" }, true);
    expect(result.status).toEqual({
      in: expect.arrayContaining(["SUBMITTED"]),
    });
  });

  it("maps status filters to supplierStatus for non-gov users", () => {
    const result = getWhereClause({ status: "Submitted" }, false);
    expect(result.supplierStatus).toEqual({
      in: expect.arrayContaining(["SUBMITTED"]),
    });
  });

  it("builds an AND date-range clause for a valid timestamp filter", () => {
    const result = getWhereClause({ submissionTimestamp: "2024-01-15" }, true);
    expect(result.AND).toHaveLength(2);
  });

  it("sets id to -1 for an invalid timestamp filter", () => {
    const result = getWhereClause({ submissionTimestamp: "not-a-date" }, true);
    expect(result.id).toBe(-1);
  });

  it("sets timestamp field to null for '--' placeholder", () => {
    const result = getWhereClause({ submissionTimestamp: "--" }, true);
    expect(result.submissionTimestamp).toBeNull();
  });

  it("only applies the organization filter for gov users", () => {
    expect(getWhereClause({ organization: "Acme" }, true).organization).toEqual(
      { is: { name: { contains: "Acme", mode: "insensitive" } } },
    );
    expect(
      getWhereClause({ organization: "Acme" }, false).organization,
    ).toBeUndefined();
  });
});

describe("getOrderByClause", () => {
  it("orders by a simple field for asc/desc values", () => {
    expect(getOrderByClause({ id: "asc" }, false, true)).toEqual([
      { id: "asc" },
    ]);
  });

  it("ignores invalid sort direction values", () => {
    expect(getOrderByClause({ id: "sideways" }, false, true)).toEqual([]);
  });

  it("falls back to sorting by id desc when defaultSortById is set and no sorts apply", () => {
    expect(getOrderByClause({}, true, true)).toEqual([{ id: "desc" }]);
  });

  it("routes status sort to supplierStatus for non-gov users", () => {
    expect(getOrderByClause({ status: "asc" }, false, false)).toEqual([
      { supplierStatus: "asc" },
    ]);
  });
});

describe("getRecordsWhereClause", () => {
  it("maps y/n to boolean for the validated filter", () => {
    expect(getRecordsWhereClause({ validated: "y" })).toEqual({
      validated: true,
    });
    expect(getRecordsWhereClause({ validated: "n" })).toEqual({
      validated: false,
    });
  });

  it("builds a case-insensitive contains filter for text fields", () => {
    expect(getRecordsWhereClause({ vin: "1AB" })).toEqual({
      vin: { contains: "1ab", mode: "insensitive" },
    });
  });

  it("handles the 'any'/'none' warnings shortcuts", () => {
    expect(getRecordsWhereClause({ warnings: "any" })).toEqual({
      warnings: { isEmpty: false },
    });
    expect(getRecordsWhereClause({ warnings: "none" })).toEqual({
      warnings: { isEmpty: true },
    });
  });

  it("sets id to -1 for an invalid date filter", () => {
    expect(getRecordsWhereClause({ timestamp: "bogus" })).toEqual({ id: -1 });
  });
});

describe("getRecordsOrderByClause", () => {
  it("orders by an allowed field", () => {
    expect(getRecordsOrderByClause({ vin: "desc" }, false)).toEqual([
      { vin: "desc" },
    ]);
  });

  it("falls back to id desc when defaultSortById is set and no sorts apply", () => {
    expect(getRecordsOrderByClause({}, true)).toEqual([{ id: "desc" }]);
  });
});

describe("getSerializedRecords", () => {
  it("serializes timestamp fields to ISO YMD strings", () => {
    const record = {
      timestamp: new Date(2024, 0, 15),
      icbcRegistrationTimestamp: new Date(2024, 0, 16),
    } as unknown as CreditApplicationRecordSparse;
    const [result] = getSerializedRecords([record]);
    expect(result.timestamp).toBe("2024-01-15");
    expect(result.icbcRegistrationTimestamp).toBe("2024-01-16");
  });

  it("passes through a null icbcRegistrationTimestamp", () => {
    const record = {
      timestamp: new Date(2024, 0, 15),
      icbcRegistrationTimestamp: null,
    } as unknown as CreditApplicationRecordSparse;
    const [result] = getSerializedRecords([record]);
    expect(result.icbcRegistrationTimestamp).toBeNull();
  });
});

describe("getSerializedApplications", () => {
  const baseRecord = {
    id: 1,
    organization: { name: "Acme Motors" },
    status: "SUBMITTED",
    supplierStatus: "SUBMITTED",
    submissionTimestamp: new Date(2024, 0, 15),
    transactionTimestamp: null,
    modelYears: ["MY_2024"],
    eligibleVinsCount: 5,
    ineligibleVinsCount: 1,
    aCredits: { toFixed: (n: number) => "1.00" },
    bCredits: { toFixed: (n: number) => "2.00" },
  } as unknown as CreditApplicationSparse;

  it("uses status for gov users and supplierStatus for non-gov users", () => {
    expect(getSerializedApplications([baseRecord], true)[0].status).toBe(
      "SUBMITTED",
    );
    expect(getSerializedApplications([baseRecord], false)[0].status).toBe(
      "SUBMITTED",
    );
  });

  it("flattens organization to its name", () => {
    expect(getSerializedApplications([baseRecord], true)[0].organization).toBe(
      "Acme Motors",
    );
  });

  it("serializes submissionTimestamp and leaves undefined transactionTimestamp as undefined", () => {
    const result = getSerializedApplications([baseRecord], true)[0];
    expect(result.submissionTimestamp).toBe("2024-01-15");
    expect(result.transactionTimestamp).toBeUndefined();
  });

  it("formats aCredits/bCredits with toFixed(2)", () => {
    const result = getSerializedApplications([baseRecord], true)[0];
    expect(result.aCredits).toBe("1.00");
    expect(result.bCredits).toBe("2.00");
  });
});
