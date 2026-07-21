// please see: https://github.com/vercel/next.js/discussions/71099

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

export type ValidationError = {
  errorType: string;
  record?: string;
  details?: string;
};

export type ValidationErrorsActionResponse = {
  responseType: "validationErrors";
  errors: ValidationError[];
};

export type ErrorOrSuccessActionResponse =
  | ErrorActionResponse
  | SuccessActionResponse;

export type DataOrErrorActionResponse<T> =
  | DataActionResponse<T>
  | ErrorActionResponse
  | ValidationErrorsActionResponse;

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

export const getValidationErrorsActionResponse = (
  errors: ValidationError[],
): ValidationErrorsActionResponse => {
  return { responseType: "validationErrors", errors };
};
