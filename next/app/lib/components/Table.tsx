"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  getLegalPairs,
  getObject,
  getString,
} from "@/lib/utils/urlSearchParams";
import { LoadingSkeleton } from "./skeletons";
import { Button } from "./inputs";
import { TableHeader } from "./TableHeader";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleLeft, faAngleRight } from "@fortawesome/free-solid-svg-icons";

interface ITableProps<T> {
  columns: ColumnDef<T, any>[];
  data: T[];
  totalNumberOfRecords: number;
  navigationAction?: (id: number) => Promise<void>;
  explicitSizing?: boolean;
  paramsToPreserve?: string[];
  stackHeaderContents?: boolean;
  title?: string;
  headerContent?: React.ReactNode;
}

interface ZevaObject {
  id: number;
}

export const Table = <T extends ZevaObject>({
  columns,
  data,
  totalNumberOfRecords,
  navigationAction,
  explicitSizing,
  paramsToPreserve,
  stackHeaderContents,
  title,
  headerContent,
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
    const newParams = new URLSearchParams();
    paramsToPreserve?.forEach((param) => {
      const paramValue = searchParams.get(param);
      if (paramValue) {
        newParams.set(param, paramValue);
      }
    });
    replaceUrl(newParams);
  }, [paramsToPreserve, searchParams, replaceUrl]);

  const currentPageSize = React.useMemo(() => {
    const pageSize = searchParams.get("pageSize");
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

  const currentPage = React.useMemo(() => {
    const page = searchParams.get("page");
    return page ? parseInt(page, 10) : 1;
  }, [searchParams]);

  const numberOfPages = React.useMemo(() => {
    if (totalNumberOfRecords === 0) {
      return 1;
    }
    return Math.ceil(totalNumberOfRecords / currentPageSize);
  }, [currentPageSize, totalNumberOfRecords]);

  const handlePageChange = React.useCallback(
    (page: string) => {
      const params = new URLSearchParams(searchParams);
      params.set("page", page);
      replaceUrl(params);
    },
    [searchParams, replaceUrl],
  );

  const handlePageNav = React.useCallback(
    (nextOrPrev: "next" | "prev") => {
      if (nextOrPrev === "next" && currentPage < numberOfPages) {
        handlePageChange((currentPage + 1).toString());
      } else if (nextOrPrev === "prev" && currentPage > 1) {
        handlePageChange((currentPage - 1).toString());
      }
    },
    [currentPage, numberOfPages, handlePageChange],
  );

  const pageNumbers = React.useMemo(() => {
    return Array.from({ length: numberOfPages }, (_, i) => i + 1);
  }, [numberOfPages]);

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
    const sorts = searchParams.get("sorts");
    return getObject(sorts) as { [key: string]: "asc" | "desc" | null };
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

  const handleNavigation = async (id: number) => {
    if (navigationAction) {
      setNavigationPending(true);
      await navigationAction(id);
    }
  };

  if (navigationPending) {
    return <LoadingSkeleton />;
  }
  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        {headerContent && <div>{headerContent}</div>}
        <Button variant="secondary" size="small" onClick={handleReset}>
          Reset Table
        </Button>
      </div>
      <div className="bg-white rounded-lg border-2 border-gray-300">
        <div className="overflow-x-auto">
          <table className={`w-full ${explicitSizing ? "table-fixed" : ""}`}>
            <TableHeader
              table={table}
              explicitSizing={explicitSizing}
              stackHeaderContents={stackHeaderContents}
              enableSorting={true}
              enableFiltering={true}
              onSortChange={handleSortChange}
              onFilterChange={handleFilterChange}
              sortState={sortsMap}
              filterState={filters}
              filterOnApply={true}
              onFilterApply={handleFilterApply}
            />
            <tbody className="bg-white divide-y divide-gray-100">
              {table.getRowModel().rows.map((row, index) => {
                const isEven = index % 2 === 0;
                return (
                  <tr
                    key={row.id}
                    className={`${isEven ? "bg-white" : "bg-gray-50"} ${
                      navigationAction
                        ? "hover:bg-blue-50 transition-colors cursor-pointer"
                        : ""
                    }`}
                    onClick={() => handleNavigation(row.original.id)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className={`px-6 py-4 text-sm text-gray-900 ${explicitSizing ? "truncate" : ""}`}
                        style={
                          explicitSizing
                            ? { width: cell.column.getSize() }
                            : undefined
                        }
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between bg-gray-50 border-t border-gray-300 px-6 py-3">
          <button
            onClick={() => handlePageNav("prev")}
            disabled={currentPage <= 1}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md ${
              currentPage > 1
                ? "text-white bg-primaryBlue hover:bg-primaryBlueHover"
                : "text-gray-400 bg-gray-200 cursor-not-allowed"
            }`}
          >
            <FontAwesomeIcon icon={faAngleLeft} />
            Previous Page
          </button>

          <div className="flex items-center gap-2">
            {pageNumbers.map((page) => {
              const isCurrentPage = currentPage === page;
              return (
                <button
                  key={page}
                  onClick={() => handlePageChange(page.toString())}
                  className={`min-w-[40px] h-[40px] px-3 py-2 text-sm font-semibold rounded-md ${
                    isCurrentPage
                      ? "bg-primaryBlue text-white"
                      : "text-gray-700 bg-white hover:bg-gray-100 border border-gray-300"
                  }`}
                >
                  {page}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <select
              value={currentPageSize}
              onChange={(e) => {
                handlePageSizeChange(e.target.value);
              }}
              className="px-3 py-2 text-sm font-medium bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[5, 10, 25, 50, 100].map((pageSize) => {
                return (
                  <option key={pageSize} value={pageSize}>
                    {pageSize} rows
                  </option>
                );
              })}
            </select>
            <button
              onClick={() => handlePageNav("next")}
              disabled={currentPage >= numberOfPages}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md ${
                currentPage < numberOfPages
                  ? "text-white bg-primaryBlue hover:bg-primaryBlueHover"
                  : "text-gray-400 bg-gray-200 cursor-not-allowed"
              }`}
            >
              Next Page
              <FontAwesomeIcon icon={faAngleRight} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
