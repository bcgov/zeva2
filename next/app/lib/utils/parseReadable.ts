// functions in this module are for use in a node environment only
import { Readable } from "node:stream";

const parseReadable = async (readable: Readable) => {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(chunk);
  }
  const buf = Buffer.concat(chunks);
  return buf;
};

export const getArrayBuffer = async (readable: Readable) => {
  const buf = await parseReadable(readable);
  return buf.buffer;
};

export const getBase64 = async (readable: Readable) => {
  const buf = await parseReadable(readable);
  return buf.toString("base64");
};
