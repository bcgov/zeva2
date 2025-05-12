import axios from "axios";

export const download = async (url: string, filename: string) => {
  const response = await axios.get(url, { responseType: "blob" });
  const objectURL = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = objectURL;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
};
