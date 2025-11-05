export const bytesToBase64 = (buffer: ArrayBuffer): string => {
  const view = new Uint8Array(buffer);
  const binString = Array.from(view, (byte) => String.fromCodePoint(byte)).join(
    "",
  );
  return btoa(binString);
};
