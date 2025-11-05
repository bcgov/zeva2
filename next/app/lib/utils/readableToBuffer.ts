import { Readable } from "node:stream";

export const getArrayBuffer = async (readable: Readable) => {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(chunk);
  }
  const buf = Buffer.concat(chunks);
  return buf.buffer;
};
