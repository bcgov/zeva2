import { getObject } from "@/lib/utils/urlSearchParams";

export type pageStringParams = {
  page?: string;
  pageSize?: string;
  filters?: string;
  sorts?: string;
};

export const getPageParams = (
  params: pageStringParams | undefined,
  defaultPage: number,
  defaultPageSize: number,
) => ({
  page: parseInt(params?.page ?? "") || defaultPage,
  pageSize: parseInt(params?.pageSize ?? "") || defaultPageSize,
  filters: getObject(params?.filters ?? null),
  sorts: getObject(params?.sorts ?? null),
});
