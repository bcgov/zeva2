// functions in this module are for use in browser environments only

export const bytesToBase64 = (buffer: ArrayBuffer): string => {
  const view = new Uint8Array(buffer);
  const binString = Array.from(view, (byte) => String.fromCodePoint(byte)).join(
    "",
  );
  return btoa(binString);
};

export const base64ToBytes = (base64: string): Uint8Array<ArrayBuffer> => {
  const binString = atob(base64);
  return Uint8Array.from<string>(binString, (m) => {
    const codePoint = m.codePointAt(0);
    if (!codePoint) {
      throw new Error("Error decoding base64!");
    }
    return codePoint;
  });
};
