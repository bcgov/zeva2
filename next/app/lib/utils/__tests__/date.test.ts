import { describe, it, expect } from "@jest/globals";
import { padZeros, validateDate, getIsoYmdString, getTimeWithTz } from "../date";

describe("date utils: padZeros", () => {
  it("pads with leading zeros to reach the target length", () => {
    expect(padZeros("5", 2)).toBe("05");
    expect(padZeros("5", 4)).toBe("0005");
  });

  it("returns the string unchanged if already at or above target length", () => {
    expect(padZeros("123", 2)).toBe("123");
    expect(padZeros("12", 2)).toBe("12");
  });
});

describe("date utils: validateDate", () => {
  it("returns true and a valid Date for a well-formed YYYY-MM-DD string", () => {
    const [isValid, date] = validateDate("2024-03-15");
    expect(isValid).toBe(true);
    expect(date.getFullYear()).toBe(2024);
    expect(date.getMonth()).toBe(2);
    expect(date.getDate()).toBe(15);
  });

  it("returns false for malformed strings", () => {
    expect(validateDate("2024-3-15")[0]).toBe(false);
    expect(validateDate("2024/03/15")[0]).toBe(false);
    expect(validateDate("not-a-date")[0]).toBe(false);
    expect(validateDate("2024-13-40")[0]).toBe(false);
  });
});

describe("date utils: getIsoYmdString", () => {
  it("formats a Date as YYYY-MM-DD", () => {
    const d = new Date(2024, 2, 5); // March 5, 2024
    expect(getIsoYmdString(d)).toBe("2024-03-05");
  });
});

describe("date utils: getTimeWithTz", () => {
  it("formats hours and minutes with padding", () => {
    const d = new Date(2024, 0, 1, 9, 5);
    const result = getTimeWithTz(d);
    expect(result.startsWith("09:05")).toBe(true);
  });
});
