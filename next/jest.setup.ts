// Jest setup to mock Prisma generated client and BullMQ for unit tests

// Minimal Decimal implementation to avoid external dependency
class DecimalMock {
  value: number;
  constructor(n: number | string | DecimalMock) {
    if (n instanceof DecimalMock) this.value = n.value;
    else this.value = Number(n);
  }
  add(n: number | string | DecimalMock) {
    const v = n instanceof DecimalMock ? n.value : Number(n);
    return new DecimalMock(this.value + v);
  }
  plus(n: number | string | DecimalMock) {
    return this.add(n);
  }
  minus(n: number | string | DecimalMock) {
    const v = n instanceof DecimalMock ? n.value : Number(n);
    return new DecimalMock(this.value - v);
  }
  equals(n: number | string | DecimalMock) {
    const v = n instanceof DecimalMock ? n.value : Number(n);
    return this.value === v;
  }
  lessThan(n: number | string | DecimalMock) {
    const v = n instanceof DecimalMock ? n.value : Number(n);
    return this.value < v;
  }
  toString() {
    return String(this.value);
  }
}

// Mock Prisma generated enums used across utils
jest.mock("@/prisma/generated/client", () => {
  const ModelYear = {
    MY_2019: "MY_2019",
    MY_2020: "MY_2020",
    MY_2021: "MY_2021",
    MY_2022: "MY_2022",
    MY_2023: "MY_2023",
    MY_2024: "MY_2024",
    MY_2025: "MY_2025",
    MY_2026: "MY_2026",
    MY_2027: "MY_2027",
    MY_2028: "MY_2028",
    MY_2029: "MY_2029",
    MY_2030: "MY_2030",
    MY_2031: "MY_2031",
    MY_2032: "MY_2032",
    MY_2033: "MY_2033",
    MY_2034: "MY_2034",
    MY_2035: "MY_2035",
  } as const;
  const AddressType = {
    MAILING: "MAILING",
    HEAD_OFFICE: "HEAD_OFFICE",
    SERVICE: "SERVICE",
    RECORDS: "RECORDS",
  } as const;
  const VehicleClass = {
    REPORTABLE: "REPORTABLE",
    NON_REPORTABLE: "NON_REPORTABLE",
  } as const;
  const ZevClass = { A: "A", B: "B", UNSPECIFIED: "UNSPECIFIED" } as const;
  const TransactionType = {
    CREDIT: "CREDIT",
    DEBIT: "DEBIT",
    TRANSFER_AWAY: "TRANSFER_AWAY",
  } as const;
  // Other enums referenced by type guards or maps can be added as needed
  const Role = {
    ADMINISTRATOR: "ADMINISTRATOR",
    DIRECTOR: "DIRECTOR",
    ENGINEER_ANALYST: "ENGINEER_ANALYST",
    ZEVA_USER: "ZEVA_USER",
  } as const;
  const Idp = { IDIR: "IDIR", BCEID: "BCEID" };
  const PenaltyCreditStatus = { DRAFT: "DRAFT", SUBMITTED: "SUBMITTED" };
  const ReferenceType = { TYPE_A: "TYPE_A", TYPE_B: "TYPE_B" };
  const VehicleStatus = { ACTIVE: "ACTIVE", INACTIVE: "INACTIVE" };
  const ModelYearReportStatus = { DRAFT: "DRAFT", SUBMITTED: "SUBMITTED" };
  const ModelYearReportSupplierStatus = { DRAFT: "DRAFT", SUBMITTED: "SUBMITTED" };
  const CreditApplicationStatus = { DRAFT: "DRAFT", SUBMITTED: "SUBMITTED" };
  const CreditApplicationSupplierStatus = { DRAFT: "DRAFT", SUBMITTED: "SUBMITTED" };
  const CreditTransferStatus = {
    DRAFT: "DRAFT",
    SUBMITTED_TO_TRANSFER_TO: "SUBMITTED_TO_TRANSFER_TO",
    APPROVED_BY_TRANSFER_TO: "APPROVED_BY_TRANSFER_TO",
    REJECTED_BY_TRANSFER_TO: "REJECTED_BY_TRANSFER_TO",
    RESCINDED_BY_TRANSFER_FROM: "RESCINDED_BY_TRANSFER_FROM",
    RECOMMEND_APPROVAL_GOV: "RECOMMEND_APPROVAL_GOV",
    RECOMMEND_REJECTION_GOV: "RECOMMEND_REJECTION_GOV",
    RETURNED_TO_ANALYST: "RETURNED_TO_ANALYST",
    APPROVED_BY_GOV: "APPROVED_BY_GOV",
    REJECTED_BY_GOV: "REJECTED_BY_GOV",
  } as const;
  const CreditTransferSupplierStatus = {
    SUBMITTED_TO_TRANSFER_TO: "SUBMITTED_TO_TRANSFER_TO",
    APPROVED_BY_TRANSFER_TO: "APPROVED_BY_TRANSFER_TO",
    REJECTED_BY_TRANSFER_TO: "REJECTED_BY_TRANSFER_TO",
    RESCINDED_BY_TRANSFER_FROM: "RESCINDED_BY_TRANSFER_FROM",
  } as const;
  const VehicleZevType = { BEV: "BEV", PHEV: "PHEV" };
  const VehicleClassCode = { PASS: "PASS", TRUCK: "TRUCK" };
  const Notification = { NEW_MESSAGE: "NEW_MESSAGE" };

  return {
    __esModule: true,
    ModelYear,
    AddressType,
    VehicleClass,
    ZevClass,
    TransactionType,
    Role,
    Idp,
    PenaltyCreditStatus,
    ReferenceType,
    VehicleStatus,
    ModelYearReportStatus,
    ModelYearReportSupplierStatus,
    CreditApplicationStatus,
    CreditApplicationSupplierStatus,
    CreditTransferStatus,
    CreditTransferSupplierStatus,
    VehicleZevType,
    VehicleClassCode,
    Notification,
  };
});

// Mock Prisma Decimal runtime
jest.mock("@/prisma/generated/client/runtime/library", () => ({
  __esModule: true,
  Decimal: DecimalMock,
}));

// Mock browser Decimal used in client-side utils
class DecimalMockBrowser extends DecimalMock {
  isInteger() {
    return Number.isInteger(this.value);
  }
  decimalPlaces() {
    const s = String(this.value);
    const i = s.indexOf(".");
    return i === -1 ? 0 : s.length - i - 1;
  }
  lte(n: number | string | DecimalMockBrowser) {
    const v = n instanceof DecimalMockBrowser ? n.value : Number(n);
    return this.value <= v;
  }
  times(n: number | string | DecimalMockBrowser) {
    const v = n instanceof DecimalMockBrowser ? n.value : Number(n);
    return new DecimalMockBrowser(this.value * v);
  }
  toNumber() {
    return this.value;
  }
}

jest.mock("@/prisma/generated/client/runtime/index-browser", () => ({
  __esModule: true,
  Decimal: DecimalMockBrowser,
}));

// Mock BullMQ Queue and connection config so tests don't hit Redis
jest.mock("@/bullmq/config", () => ({
  __esModule: true,
  bullmqConfig: {
    queueConnection: {},
    queueDefaultJobOptions: {},
  },
}));

jest.mock("bullmq", () => {
  const instances: any[] = [];
  const add = jest.fn().mockResolvedValue(undefined);
  const Queue = jest.fn().mockImplementation(function (name: string, opts: any) {
    this.name = name;
    this.opts = opts;
    this.add = add;
    instances.push(this);
  });
  // expose internals for tests to assert
  // @ts-ignore
  Queue.__instances = instances;
  // @ts-ignore
  Queue.__add = add;
  return { Queue };
});
// Extend jest with testing-library matchers
import "@testing-library/jest-dom";
