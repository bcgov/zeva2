import axios from "axios";
import JSZip from "jszip";
import { AttachmentDownload } from "../services/attachments";

const doDownload = (filename: string, data: ArrayBuffer) => {
  const objectURL = window.URL.createObjectURL(new Blob([data]));
  const link = document.createElement("a");
  link.href = objectURL;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
};

export const download = async (url: string, filename: string) => {
  const response = await axios.get(url, { responseType: "blob" });
  doDownload(filename, response.data);
};

export const downloadBuffer = (filename: string, buffer: ArrayBuffer) => {
  doDownload(filename, buffer);
};

export const downloadZip = async (
  folderName: string,
  files: {
    fileName: string;
    data: ArrayBuffer;
  }[],
) => {
  const uniqueFileNames = new Set<string>();
  files.forEach((file) => {
    uniqueFileNames.add(file.fileName);
  });
  const newFiles: typeof files = [];
  if (uniqueFileNames.size !== files.length) {
    files.forEach((file, index) => {
      newFiles.push({ fileName: `${index}-${file.fileName}`, data: file.data });
    });
  }
  const currDate = new Date();
  const dateWithOffset = new Date(
    currDate.getTime() - currDate.getTimezoneOffset() * 60000,
  );
  const zip = new JSZip();
  (newFiles.length !== 0 ? newFiles : files).forEach((file) => {
    zip.file(file.fileName, file.data, { date: dateWithOffset });
  });
  const zipped = await zip.generateAsync({ type: "arraybuffer" });
  downloadBuffer(folderName, zipped);
};

export const getFiles = async (data: AttachmentDownload[]) => {
  const fileNames: string[] = [];
  const urls: string[] = [];
  for (const datum of data) {
    fileNames.push(datum.fileName);
    urls.push(datum.url);
  }
  const files = await Promise.all(
    urls.map((url) => {
      return axios.get(url, {
        responseType: "arraybuffer",
      });
    }),
  );
  const payload: { fileName: string; data: ArrayBuffer }[] = [];
  for (const [index, file] of files.entries()) {
    payload.push({
      fileName: fileNames[index],
      data: file.data,
    });
  }
  return payload;
};

export const downloadMultiple = async (
  data: AttachmentDownload[],
  zipName: string,
) => {
  const payload = await getFiles(data);
  if (payload.length > 1) {
    await downloadZip(`${zipName}.zip`, payload);
  } else if (payload.length === 1) {
    downloadBuffer(payload[0].fileName, payload[0].data);
  }
};
