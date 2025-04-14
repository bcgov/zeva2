"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  FaArrowLeft,
  FaArrowRight,
  FaDownLong,
  FaUpLong,
} from "react-icons/fa6";
import { Show } from "./layout";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  getLegalPairs,
  getObject,
  getString,
} from "@/lib/utils/urlSearchParams";
import { LoadingSkeleton } from "./skeletons";

interface ITableProps<T> {
  columns: ColumnDef<T, any>[];
  data: T[];
  totalNumberOfRecords: number;
  navigationAction: (id: string) => Promise<void>;
  footer?: boolean;
}

interface ZevaObject {
  id: number;
}

export const Table = <T extends ZevaObject>({
  columns,
  data,
  totalNumberOfRecords,
  navigationAction,
  footer,
}: ITableProps<T>) => {
  const { replace } = useRouter();
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const [navigationPending, setNavigationPending] =
    React.useState<boolean>(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [filters, setFilters] = React.useState<{ [key: string]: string }>(
    getObject(searchParams.get("filters")),
  );

  const replaceUrl = React.useCallback(
    (params: URLSearchParams) => {
      replace(`${pathname}?${params.toString()}`);
    },
    [replace, pathname],
  );

  const handleReset = React.useCallback(() => {
    replaceUrl(new URLSearchParams());
  }, [replaceUrl]);

  const currentPage = React.useMemo(() => {
    const params = new URLSearchParams(searchParams);
    const page = params.get("page");
    return page ?? 1;
  }, [searchParams]);

  const handlePageChange = React.useCallback(
    (page: string) => {
      const params = new URLSearchParams(searchParams);
      params.set("page", page);
      replaceUrl(params);
    },
    [searchParams, replaceUrl],
  );

  const currentPageSize = React.useMemo(() => {
    const params = new URLSearchParams(searchParams);
    const pageSize = params.get("pageSize");
    return parseInt(pageSize ?? "") || 10;
  }, [searchParams]);

  const handlePageSizeChange = React.useCallback(
    (pageSize: string) => {
      const params = new URLSearchParams(searchParams);
      params.set("pageSize", pageSize);
      params.set("page", "1");
      replaceUrl(params);
    },
    [searchParams, replaceUrl],
  );

  const handleFilterChange = React.useCallback((key: string, value: string) => {
    setFilters((prev) => {
      if (value) {
        return {
          ...prev,
          [key]: value,
        };
      }
      const prevCopy = { ...prev };
      delete prevCopy[key];
      return prevCopy;
    });
  }, []);

  const handleFilterApply = React.useCallback(() => {
    const params = new URLSearchParams(searchParams);
    const legalFilters = getLegalPairs(filters);
    const filtersString = getString(legalFilters);
    if (filtersString) {
      params.set("filters", filtersString);
    } else {
      params.delete("filters");
    }
    params.set("page", "1");
    replaceUrl(params);
  }, [searchParams, filters, replaceUrl]);

  const sortsMap = React.useMemo(() => {
    const params = new URLSearchParams(searchParams);
    const sorts = params.get("sorts");
    return getObject(sorts);
  }, [searchParams]);

  const handleSortChange = React.useCallback(
    (column: string) => {
      const params = new URLSearchParams(searchParams);
      const sorts = params.get("sorts");
      const sortsObject = getObject(sorts);
      let newDirection = null;
      const currentDirection = sortsObject[column];
      if (currentDirection === "asc") {
        newDirection = "desc";
      } else if (!currentDirection) {
        newDirection = "asc";
      }
      if (newDirection) {
        sortsObject[column] = newDirection;
      } else {
        delete sortsObject[column];
      }
      const legalSorts = getLegalPairs(sortsObject);
      if (Object.keys(legalSorts).length > 0) {
        params.set("sorts", getString(legalSorts));
      } else {
        params.delete("sorts");
      }
      params.set("page", "1");
      replaceUrl(params);
    },
    [searchParams, replaceUrl],
  );

  const handleNavigation = async (id: string) => {
    setNavigationPending(true);
    await navigationAction(id);
  };

  const numberOfPages = React.useMemo(() => {
    if (totalNumberOfRecords === 0) {
      return 1;
    }
    return Math.ceil(totalNumberOfRecords / currentPageSize);
  }, [currentPageSize, totalNumberOfRecords]);

  const pageOptionsJSX = React.useMemo(() => {
    const result: React.JSX.Element[] = [];
    for (let i = 1; i <= numberOfPages; i++) {
      result.push(
        <option key={i} value={i}>
          {i}
        </option>,
      );
    }
    return result;
  }, [numberOfPages]);

  if (navigationPending) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="p-2">
      <table className="min-w-full divide-y divide-gray-200 rounded border-t border-l border-r border-navBorder">
        <thead className="bg-gray-50">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  <span className="inline-flex items-center gap-1">
                    {header.isPlaceholder ? null : (
                      <>
                        <div
                          className={
                            header.column.getCanSort()
                              ? "cursor-pointer select-none"
                              : ""
                          }
                          onClick={() => {
                            if (header.column.getCanSort()) {
                              handleSortChange(header.id);
                            }
                          }}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          {sortsMap[header.id] === "asc" ? (
                            <FaUpLong size={10} className="mb-1" />
                          ) : sortsMap[header.id] === "desc" ? (
                            <FaDownLong size={10} className="mb-1" />
                          ) : (
                            ""
                          )}
                        </div>
                        {header.column.getCanFilter() ? (
                          <div>
                            <input
                              className="w-36 border shadow rounded"
                              onChange={(event) => {
                                handleFilterChange(
                                  header.id,
                                  event.target.value,
                                );
                              }}
                              onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                  handleFilterApply();
                                }
                              }}
                              placeholder={"Press Enter to Search"}
                              type="text"
                              value={filters[header.id] ?? ""}
                            />
                          </div>
                        ) : null}
                      </>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className="hover:bg-gray-200 transition-colors cursor-pointer"
              onClick={() => handleNavigation(row.original.id.toString())}
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        <Show when={!!footer}>
          <tfoot className="bg-gray-50">
            {table.getFooterGroups().map((footerGroup) => (
              <tr key={footerGroup.id}>
                {footerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.footer,
                          header.getContext(),
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </tfoot>
        </Show>
      </table>
      <div className="flex items-center justify-center bg-navBorder w-full rounded p-2">
        {/* <FaArrowLeft
            onClick={() => table.getCanPreviousPage() && table.previousPage()}
            className="mr-2 text-defaultTextBlack cursor-pointer"
          /> */}
        <span className="text-sm text-gray-700">
          Page{" "}
          {
            <select
              value={currentPage}
              onChange={(event) => {
                handlePageChange(event.target.value);
              }}
            >
              {pageOptionsJSX}
            </select>
          }{" "}
          of {numberOfPages}
        </span>
        {/* <FaArrowRight
            onClick={() => table.getCanNextPage() && table.nextPage()}
            className="ml-2 text-defaultTextBlack cursor-pointer"
          /> */}
      </div>
    </div>
  );
};
