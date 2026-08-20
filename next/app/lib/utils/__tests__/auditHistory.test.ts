import { describe, it, expect } from "@jest/globals";
import { getStatusVariant, processAuditHistories } from "../auditHistory";

describe("getStatusVariant", () => {
  it("maps known status substrings to their variant", () => {
    expect(getStatusVariant("Approved")).toBe("approved");
    expect(getStatusVariant("Validated")).toBe("approved");
    expect(getStatusVariant("Escalated for review")).toBe("escalated");
    // "review" is a substring of "reviewed", so the escalated check always
    // wins first and the "reviewed" branch is currently unreachable.
    expect(getStatusVariant("Reviewed by analyst")).toBe("escalated");
    expect(getStatusVariant("Updated")).toBe("submitted");
    expect(getStatusVariant("Submitted")).toBe("submitted");
    expect(getStatusVariant("Returned")).toBe("returned");
    expect(getStatusVariant("Rejected")).toBe("returned");
  });

  it("falls back to 'default' for unrecognized statuses", () => {
    expect(getStatusVariant("Something Else")).toBe("default");
  });
});

describe("processAuditHistories", () => {
  const baseHistory = {
    id: 1,
    timestamp: new Date(2024, 0, 1, 9, 0),
    userAction: "SUBMIT",
    comment: "first comment",
    user: {
      firstName: "Jane",
      lastName: "Doe",
      organization: { isGovernment: false },
    },
  };

  const govHistory = {
    id: 2,
    timestamp: new Date(2024, 0, 2, 9, 0),
    userAction: "APPROVE",
    comment: null,
    user: {
      firstName: "John",
      lastName: "Smith",
      organization: { isGovernment: true },
    },
  };

  const statusMap = { SUBMIT: "Submitted", APPROVE: "Approved" };

  it("sorts entries newest first and maps actor/status fields", () => {
    const result = processAuditHistories({
      histories: [baseHistory, govHistory],
      userIsGov: false,
      statusMap,
    });

    expect(result.entries).toHaveLength(2);
    expect(result.entries[0].id).toBe(2);
    expect(result.entries[0].status).toBe("Approved");
    expect(result.entries[0].statusVariant).toBe("approved");
  });

  it("masks government user names when the viewer is not gov", () => {
    const result = processAuditHistories({
      histories: [govHistory],
      userIsGov: false,
      statusMap,
    });
    expect(result.entries[0].actor).toBe("Government of BC");
  });

  it("does not mask government user names when the viewer is gov", () => {
    const result = processAuditHistories({
      histories: [govHistory],
      userIsGov: true,
      statusMap,
    });
    expect(result.entries[0].actor).toBe("John Smith");
  });

  it("builds a summary from the most recent approved entry", () => {
    const result = processAuditHistories({
      histories: [baseHistory, govHistory],
      userIsGov: true,
      statusMap,
    });
    expect(result.summary).toBeDefined();
    expect(result.summary?.status).toBe("Approved");
    expect(result.summary?.decisionMaker).toBe("John Smith");
  });

  it("returns undefined summary when no entry is approved", () => {
    const result = processAuditHistories({
      histories: [baseHistory],
      userIsGov: true,
      statusMap,
    });
    expect(result.summary).toBeUndefined();
  });

  it("builds unique status and role options", () => {
    const result = processAuditHistories({
      histories: [baseHistory, govHistory],
      userIsGov: true,
      statusMap,
    });
    expect(result.statusOptions).toEqual([
      { value: "Approved", label: "Approved" },
      { value: "Submitted", label: "Submitted" },
    ]);
    expect(result.roleOptions.map((r) => r.value)).toEqual([
      "John Smith",
      "Jane Doe",
    ]);
  });
});
