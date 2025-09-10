import {
  getObject,
  getString,
  getLegalPairs,
  interPairDelimiter,
  intraPairDelimiter,
} from "../urlSearchParams";

describe("urlSearchParams utils", () => {
  test("getObject parses delimited string", () => {
    const s = `a${intraPairDelimiter}1${interPairDelimiter}b${intraPairDelimiter}two`;
    expect(getObject(s)).toEqual({ a: "1", b: "two" });
  });

  test("getString serializes object to delimited string", () => {
    const o = { x: "y", z: "9" };
    const str = getString(o);
    // Order is not guaranteed; both permutations should be allowed
    expect([
      `x${intraPairDelimiter}y${interPairDelimiter}z${intraPairDelimiter}9`,
      `z${intraPairDelimiter}9${interPairDelimiter}x${intraPairDelimiter}y`,
    ]).toContain(str);
  });

  test("getLegalPairs filters keys/values containing intraPairDelimiter", () => {
    const o = {
      "a|b": "v1",
      good: "ok",
      bad: "no|pe",
      fine: "works",
    };
    expect(getLegalPairs(o)).toEqual({ good: "ok", fine: "works" });
  });

  test("getObject returns empty object for null", () => {
    expect(getObject(null)).toEqual({});
  });
});

