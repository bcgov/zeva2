export type DataActionResponse<T> = {
  responseType: "data";
  data: T;
};

export type ErrorActionResponse = {
  responseType: "error";
  message: string;
};

export type SuccessActionResponse = {
  responseType: "success";
};

export type ErrorOrSuccessActionResponse =
  | ErrorActionResponse
  | SuccessActionResponse;

export type DataOrErrorActionResponse<T> =
  | DataActionResponse<T>
  | ErrorActionResponse;

export const getDataActionResponse = <T>(data: T): DataActionResponse<T> => {
  return {
    responseType: "data",
    data,
  };
};

export const getErrorActionResponse = (
  errorMsg: string,
): ErrorActionResponse => {
  return { responseType: "error", message: errorMsg };
};

export const getSuccessActionResponse = (): SuccessActionResponse => {
  return { responseType: "success" };
};
