import {
  getAdjacentYear,
  getComplianceDate,
  getComplianceInterval,
  getCompliancePeriod,
} from "../complianceYear";
import { ModelYear } from "@/prisma/generated/client";

describe("complianceYear helpers", () => {
  test("getCompliancePeriod returns correct bounds and order", () => {
    const p = getCompliancePeriod(2024);
    expect(p.closedLowerBound).toBeInstanceOf(Date);
    expect(p.openUpperBound).toBeInstanceOf(Date);
    expect(+p.openUpperBound > +p.closedLowerBound).toBe(true);
  });

  test("getAdjacentYear returns prev/next within bounds", () => {
    expect(getAdjacentYear("prev", ModelYear.MY_2024)).toBe(ModelYear.MY_2023);
    expect(getAdjacentYear("next", ModelYear.MY_2024)).toBe(ModelYear.MY_2025);
  });

  test("getComplianceInterval uses adjacent year for upper bound", () => {
    const i = getComplianceInterval(ModelYear.MY_2024);
    expect(i.closedLowerBound).toBeInstanceOf(Date);
    expect(i.openUpperBound).toBeInstanceOf(Date);
    expect(+i.openUpperBound > +i.closedLowerBound).toBe(true);
  });

  test("getComplianceDate returns end-of-September date for next model year", () => {
    const d = getComplianceDate(ModelYear.MY_2024);
    expect(d).toBeInstanceOf(Date);
    // Year should match next model year (2025 in our mock)
    expect(d.getFullYear()).toBe(2025);
    expect(d.getMonth()).toBe(8); // September (0-based)
    expect(d.getDate()).toBe(30);
  });
});

