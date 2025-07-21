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
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  getLegalPairs,
  getObject,
  getString,
} from "@/lib/utils/urlSearchParams";
import { LoadingSkeleton } from "./skeletons";
import { Button } from "./inputs";

interface ITableProps<T> {
  columns: ColumnDef<T, any>[];
  data: T[];
  totalNumberOfRecords: number;
  navigationAction?: (id: number) => Promise<void>;
  explicitSizing?: boolean;
  paramsToPreserve?: string[];
  onReset?: () => void;
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
  onReset,
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
    if (onReset) {
      onReset();
    }
    replaceUrl(newParams);
  }, [paramsToPreserve, searchParams, onReset, replaceUrl]);

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

  const handleNavigation = async (id: number) => {
    if (navigationAction) {
      setNavigationPending(true);
      await navigationAction(id);
    }
  };

  const getSizingHeaders: () => React.JSX.Element | null = () => {
    if (!explicitSizing) {
      return null;
    }
    const lastGroup = table.getHeaderGroups().at(-1);
    if (!lastGroup) {
      return null;
    }
    const sizingHeaders: React.JSX.Element[] = lastGroup.headers.map(
      (header) => (
        <th
          key={header.id}
          className="px-6 py-3 border-b-2 relative"
          style={{ width: header.getSize() }}
        >
          <div
            {...{
              onDoubleClick: () => header.column.resetSize(),
              onMouseDown: header.getResizeHandler(),
              className:
                "bg-primaryBlue absolute w-[5px] h-full top-0 right-0 cursor-col-resize select-none touch-none",
              style: {
                transform: header.column.getIsResizing()
                  ? `translateX(${table.getState().columnSizingInfo.deltaOffset ?? 0}px)`
                  : "",
              },
            }}
          />
        </th>
      ),
    );
    if (sizingHeaders) {
      return <tr key={"sizingHeaders"}>{sizingHeaders}</tr>;
    }
    return null;
  };

  if (navigationPending) {
    return <LoadingSkeleton />;
  }
  return (
    <div className="p-2">
      <div className="flex flex-row-reverse">
        <Button className="mr-10 mb-3 px-3" onClick={handleReset}>
          Reset Table
        </Button>
      </div>
      <div className="overflow-x-scroll">
        <table
          className={`w-full divide-y divide-gray-200 rounded border-t border-l border-r border-navBorder ${explicitSizing ? "table-fixed" : ""}`}
        >
          <thead className="bg-gray-50">
            {explicitSizing && getSizingHeaders()}
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${explicitSizing ? "truncate" : ""}`}
                    style={
                      explicitSizing ? { width: header.getSize() } : undefined
                    }
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
                className={
                  navigationAction
                    ? "hover:bg-gray-200 transition-colors cursor-pointer"
                    : ""
                }
                onClick={() => handleNavigation(row.original.id)}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className={`px-6 py-4 whitespace-nowrap ${explicitSizing ? "truncate" : ""}`}
                    style={
                      explicitSizing
                        ? { width: cell.column.getSize() }
                        : undefined
                    }
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-center bg-navBorder w-full rounded p-2">
        <FaArrowLeft
          onClick={() => {
            handlePageNav("prev");
          }}
          className="mr-2 text-defaultTextBlack cursor-pointer"
        />
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
        <FaArrowRight
          onClick={() => {
            handlePageNav("next");
          }}
          className="ml-2 text-defaultTextBlack cursor-pointer"
        />
        <span className="ml-3">
          <select
            value={currentPageSize}
            onChange={(e) => {
              handlePageSizeChange(e.target.value);
            }}
          >
            {[5, 10, 25, 50, 100].map((pageSize) => {
              return (
                <option key={pageSize} value={pageSize}>
                  {pageSize} rows
                </option>
              );
            })}
          </select>
        </span>
      </div>
    </div>
  );
};
