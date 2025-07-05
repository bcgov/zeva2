import {
  describe,
  it,
  expect,
  beforeEach,
} from "@jest/globals";
import { OrganizationSparse } from "../data";
import {
  getSupplierClass,
  filterOrganizations,
  sortOrganzations,
  cleanupStringData,
  cleanupAddressData,
  isEmptyAddress,
} from "../utils";
import {
  testOrganizations,
} from "./__test-utilities__/utils-test-data";


describe("Organization utils: getSupplierClass", () => {
  // The pre-condition of this function assumes the model years are
  //  in descending order.

  it("returns N/A when last 3 years have no volumes", () => {
    expect(getSupplierClass([])).toBe("N/A");
    
    expect(getSupplierClass([
      { volume: 0 },
      { volume: 0 },
    ])).toBe("N/A");

    expect(getSupplierClass([
      { volume: 0 },
      { volume: 0 },
      { volume: 0 },
    ])).toBe("N/A");

    expect(getSupplierClass([
      { volume: 0 },
      { volume: 0 },
      { volume: 0 },
      { volume: 500 },
      { volume: 2000 },
      { volume: 900 },
    ])).toBe("N/A");
  });

  it("returns SMALL for last 3 year's average < 1000", () => {
    expect(getSupplierClass([
      { volume: 500 },
      { volume: 800 },
      { volume: 900 },
    ])).toBe("SMALL");

    expect(getSupplierClass([
      { volume: 500 },
      { volume: 800 },
      { volume: 900 },
      { volume: 80000 },
      { volume: 20000 },
    ])).toBe("SMALL");

    expect(getSupplierClass([
      { volume: 999 },
      { volume: 999 },
      { volume: 999 },
    ])).toBe("SMALL");
  });

  it("returns MEDIUM for last 3 year's average >= 1000 and < 5000", () => {
    expect(getSupplierClass([
      { volume: 2000 },
      { volume: 3000 },
      { volume: 4000 },
    ])).toBe("MEDIUM");

    expect(getSupplierClass([
      { volume: 1000 },
      { volume: 1000 },
      { volume: 1000 },
    ])).toBe("MEDIUM");

    expect(getSupplierClass([
      { volume: 4999 },
      { volume: 4999 },
      { volume: 4999 },
      { volume: 10000 },
    ])).toBe("MEDIUM");
  });

  it("returns LARGE for last 3 year's average >= 5000", () => {
    expect(getSupplierClass([
      { volume: 6000 },
      { volume: 7000 },
      { volume: 8000 },
    ])).toBe("LARGE");

    expect(getSupplierClass([
      { volume: 5000 },
      { volume: 5000 },
      { volume: 5000 },
      { volume: 1000 },
      { volume: 400 },
    ])).toBe("LARGE");
  });

  it("returns correct class if less than 3 years of data", () => {
    expect(getSupplierClass([{ volume: 4500 }])).toBe("MEDIUM");
    expect(getSupplierClass([{ volume: 9000 }])).toBe("LARGE");
  });
});


describe("Organization utils: filterOrganizations", () => {
  let orgs: OrganizationSparse[];

  beforeEach(() => {
    orgs = [...testOrganizations];
  });

  it("filters by name (case-insensitive, partial match)", () => {
    const filtered = filterOrganizations(orgs, { name: "Eta o" });
    expect(filtered).toHaveLength(4);
    expect(filtered.map(o => o.name).sort()).toEqual([
      "Beta Org",
      "Eta Org",
      "Theta Org",
      "Zeta Org"
    ].sort());
  });

  it("filters by zevUnitBalanceB (number)", () => {
    const filtered = filterOrganizations(orgs, { zevUnitBalanceB: "3000" });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe("Beta Org");
  });

  it("filters by zevUnitBalanceB with = operator", () => {
    const filtered = filterOrganizations(orgs, { zevUnitBalanceB: "=3000" });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe("Beta Org");
  });

  it("filters by zevUnitBalanceA with > operator", () => {
    const filtered = filterOrganizations(orgs, { zevUnitBalanceA: ">1000" });
    expect(filtered).toHaveLength(6);
    expect(filtered.map(o => o.name).sort()).toEqual([
      "Alpha Org",
      "Delta Org",
      "Epsilon Org",
      "Gamma Org",
      "Theta Org",
      "Zeta Org"
    ].sort());
  });

  it("filters by zevUnitBalanceA with < operator", () => {
    const filtered = filterOrganizations(orgs, { zevUnitBalanceA: "<1000" });
    expect(filtered).toHaveLength(2);
    expect(filtered.map(o => o.name).sort()).toEqual([
      "Beta Org",
      "Eta Org"
    ].sort());
  });

  it("filters by zevUnitBalanceA with <= operator", () => {
    const filtered = filterOrganizations(orgs, { zevUnitBalanceA: "<=1500" });
    expect(filtered).toHaveLength(3);
    expect(filtered.map(o => o.name).sort()).toEqual([
      "Beta Org",
      "Delta Org",
      "Eta Org"
    ].sort());
  });

  it("filters by zevUnitBalanceA with >= operator", () => {
    const filtered = filterOrganizations(orgs, { zevUnitBalanceA: ">=4000" });
    expect(filtered).toHaveLength(3);
    expect(filtered.map(o => o.name).sort()).toEqual([
      "Gamma Org",
      "Theta Org",
      "Zeta Org"
    ].sort());
  });

  it("filters by zevUnitBalanceB with DEFICIT", () => {
    const filtered = filterOrganizations(orgs, { zevUnitBalanceB: "def" });
    expect(filtered).toHaveLength(2);
    expect(filtered.map(o => o.name).sort()).toEqual([
      "Alpha Org",
      "Zeta Org"
    ].sort());
  });

  it("returns all if filters is empty", () => {
    const filtered = filterOrganizations(orgs, {});
    expect(filtered).toHaveLength(8);
  });
});


describe("Organization utils: sortOrganzations", () => {
  let orgs: OrganizationSparse[];

  beforeEach(() => {
    orgs = [...testOrganizations];
  });

  it("sorts by name ascending", () => {
    sortOrganzations(orgs, { name: "asc" });
    expect(orgs.map(o => o.name)).toEqual([
      "Alpha Org",
      "Beta Org",
      "Delta Org",
      "Epsilon Org",
      "Eta Org",
      "Gamma Org",
      "Theta Org",
      "Zeta Org"
    ]);
  });

  it("sorts by name descending", () => {
    sortOrganzations(orgs, { name: "desc" });
    expect(orgs.map(o => o.name)).toEqual([
      "Zeta Org",
      "Theta Org",
      "Gamma Org",
      "Eta Org",
      "Epsilon Org",
      "Delta Org",
      "Beta Org",
      "Alpha Org"
    ]);
  });

  it("sorts by zevUnitBalanceA in ascending order", () => {
    sortOrganzations(orgs, { zevUnitBalanceA: "asc" });
    expect(orgs.map(o => o.zevUnitBalanceA)).toEqual([
      "100",
      "300",
      "1500",
      "2000",
      "2500",
      "4000",
      "5000",
      "8000"
    ]);
  });

  it("sorts by zevUnitBalanceB with DEFICIT in asending order", () => {
    sortOrganzations(orgs, { zevUnitBalanceB: "asc" });
    expect(orgs.map(o => o.zevUnitBalanceB)).toEqual([
      "DEFICIT", // Alpha Org
      "DEFICIT", // Zeta Org
      "500",     // Epsilon Org
      "700",     // Eta Org
      "1000",    // Gamma Org
      "2000",    // Delta Org
      "2500",    // Theta Org
      "3000"     // Beta Org
    ]);
  });

  it("sorts by zevUnitBalanceB with DEFICIT in descending order", () => {
    sortOrganzations(orgs, { zevUnitBalanceB: "desc" });
    expect(orgs.map(o => o.zevUnitBalanceB)).toEqual([
      "3000",    // Beta Org
      "2500",    // Theta Org
      "2000",    // Delta Org
      "1000",    // Gamma Org
      "700",     // Eta Org
      "500",     // Epsilon Org
      "DEFICIT", // Alpha Org
      "DEFICIT"  // Zeta Org
    ]);
  });
});


describe("Organization utils: cleanupStringData", () => {
  it("returns null for null or empty string", () => {
    expect(cleanupStringData(null)).toBeNull();
    expect(cleanupStringData("")).toBeNull();
    expect(cleanupStringData("   ")).toBeNull();
  });

  it("trims and returns string if not empty", () => {
    expect(cleanupStringData("  hello  ")).toBe("hello");
  });
});


describe("Organization utils: cleanupAddressData", () => {
  it("cleans up each string field", () => {
    const testAddress = {
      addressLines: "1234 Kingsway\n  ",
      city: " Burnaby",
      postalCode: "  ",
      country: "Canada",
      state: "BC",
      county: null,
      representative: "",
    };
  
    const cleaned = cleanupAddressData(testAddress);
    expect(cleaned).toEqual({
      addressLines: "1234 Kingsway",
      city: "Burnaby",
      postalCode: null,
      country: "Canada",
      state: "BC",
      county: null,
      representative: null,
    });
  });

  it("returns undefined if address is undefined", () => {
    expect(cleanupAddressData()).toBeUndefined();
  });
});


describe("Organization utils: isEmptyAddress", () => {
  it("returns true if all fields are empty or whitespace", () => {
    const testAddress = {
      addressLines: "  ",
      city: "",
      postalCode: "",
      country: null,
      state: " ",
      county: null,
      representative: "",
    };
    expect(isEmptyAddress(testAddress)).toBe(true);
  });

  it("returns false if any field is non-empty", () => {
    const testAddress = {
      addressLines: null,
      city: null,
      postalCode: "",
      country: null,
      state: "BC",
      county: null,
      representative: "",
    };
    expect(isEmptyAddress(testAddress)).toBe(false);
  });
});
