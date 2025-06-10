import axios from "axios";

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
