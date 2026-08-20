import { describe, it, expect } from "@jest/globals";
import { bytesToBase64, base64ToBytes } from "../base64";

describe("base64 utils", () => {
  it("round-trips bytes through bytesToBase64 and base64ToBytes", () => {
    const original = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
    const encoded = bytesToBase64(original.buffer);
    const decoded = base64ToBytes(encoded);
    expect(Array.from(decoded)).toEqual(Array.from(original));
  });

  it("encodes an empty buffer to an empty string", () => {
    expect(bytesToBase64(new Uint8Array([]).buffer)).toBe("");
  });

  it("decodes an empty string to an empty byte array", () => {
    expect(Array.from(base64ToBytes(""))).toEqual([]);
  });
});
