import Excel from "exceljs";

export type HeadersMap = Partial<Record<string, string>>;

export const getHeadersMap = (
  headers: Excel.Row,
  domainIsIndices: boolean,
): HeadersMap => {
  const headersMap: HeadersMap = {};
  headers.eachCell((cell) => {
    const col = cell.col;
    const value = cell.value?.toString();
    if (value) {
      if (domainIsIndices) {
        headersMap[col] = value;
      } else {
        headersMap[value] = col;
      }
    }
  });
  return headersMap;
};
