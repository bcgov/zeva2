"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  SortingState,
  ColumnFiltersState,
} from "@tanstack/react-table";
import { Button } from "./inputs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAngleDown,
  faAngleUp,
  faAngleLeft,
  faAngleRight,
} from "@fortawesome/free-solid-svg-icons";

interface IClientSideTableProps<T> {
  columns: ColumnDef<T, any>[];
  data: T[];
  navigationAction?: (id: number) => void;
  explicitSizing?: boolean;
  stackHeaderContents?: boolean;
  enableFiltering?: boolean;
  enableSorting?: boolean;
  initialPageSize?: number;
}

interface ZevaObject {
  id: number;
}

export const ClientSideTable = <T extends ZevaObject>({
  columns,
  data,
  navigationAction,
  explicitSizing,
  stackHeaderContents,
  enableFiltering = false,
  enableSorting = false,
  initialPageSize = 10,
}: IClientSideTableProps<T>) => {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: initialPageSize,
  });

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const handleNavigation = (id: number) => {
    if (navigationAction) {
      navigationAction(id);
    }
  };

  const handleReset = () => {
    setSorting([]);
    setColumnFilters([]);
    setPagination({
      pageIndex: 0,
      pageSize: initialPageSize,
    });
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

  return (
    <div className="bg-white rounded-lg shadow-level-1 p-4">
      <div className="flex flex-row-reverse">
        <Button variant="secondary" size="small" onClick={handleReset}>
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
                    <span
                      className={`inline-flex gap-1 ${stackHeaderContents ? "flex-col items-start" : "items-center"}`}
                    >
                      {header.isPlaceholder ? null : (
                        <>
                          <div
                            className={
                              enableSorting && header.column.getCanSort()
                                ? "cursor-pointer select-none"
                                : ""
                            }
                            onClick={() => {
                              if (enableSorting && header.column.getCanSort()) {
                                header.column.toggleSorting();
                              }
                            }}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                            {enableSorting &&
                            header.column.getIsSorted() === "asc" ? (
                              <FontAwesomeIcon
                                icon={faAngleUp}
                                className="mb-1"
                              />
                            ) : enableSorting &&
                              header.column.getIsSorted() === "desc" ? (
                              <FontAwesomeIcon
                                icon={faAngleDown}
                                className="mb-1"
                              />
                            ) : (
                              ""
                            )}
                          </div>
                          {enableFiltering && header.column.getCanFilter() ? (
                            <div>
                              <input
                                className="w-36 border shadow-level-1 rounded"
                                onChange={(event) => {
                                  header.column.setFilterValue(
                                    event.target.value,
                                  );
                                }}
                                placeholder={"Filter..."}
                                type="text"
                                value={
                                  (header.column.getFilterValue() as string) ??
                                  ""
                                }
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
        <FontAwesomeIcon
          icon={faAngleLeft}
          onClick={() => table.previousPage()}
          className={`mr-2 cursor-pointer ${
            !table.getCanPreviousPage()
              ? "text-gray-400"
              : "text-defaultTextBlack"
          }`}
          style={{
            pointerEvents: table.getCanPreviousPage() ? "auto" : "none",
          }}
        />
        <span className="text-sm text-gray-700">
          Page{" "}
          {
            <select
              value={table.getState().pagination.pageIndex + 1}
              onChange={(event) => {
                table.setPageIndex(Number(event.target.value) - 1);
              }}
            >
              {Array.from(
                { length: table.getPageCount() },
                (_, i) => i + 1,
              ).map((page) => (
                <option key={page} value={page}>
                  {page}
                </option>
              ))}
            </select>
          }{" "}
          of {table.getPageCount()}
        </span>
        <FontAwesomeIcon
          icon={faAngleRight}
          onClick={() => table.nextPage()}
          className={`ml-2 cursor-pointer ${
            !table.getCanNextPage() ? "text-gray-400" : "text-defaultTextBlack"
          }`}
          style={{
            pointerEvents: table.getCanNextPage() ? "auto" : "none",
          }}
        />
        <span className="ml-3">
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => {
              table.setPageSize(Number(e.target.value));
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
