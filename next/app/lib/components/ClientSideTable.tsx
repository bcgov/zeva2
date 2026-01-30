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
import { getSizingHeaders } from "@/app/lib/utils/tableUtils";
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

  const renderSortIcon = (sortState: false | "asc" | "desc") => {
    if (!enableSorting) return null;
    
    if (sortState === "asc") {
      return <FontAwesomeIcon icon={faAngleUp} className="mb-1" />;
    }
    if (sortState === "desc") {
      return <FontAwesomeIcon icon={faAngleDown} className="mb-1" />;
    }
    return null;
  };

  const renderFilterInput = (header: any) => {
    if (!enableFiltering || !header.column.getCanFilter()) {
      return null;
    }
    return (
      <div>
        <input
          className="w-36 border shadow-level-1 rounded"
          onChange={(event) => {
            header.column.setFilterValue(event.target.value);
          }}
          placeholder={"Filter..."}
          type="text"
          value={(header.column.getFilterValue() as string) ?? ""}
        />
      </div>
    );
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
            {explicitSizing && getSizingHeaders(table, explicitSizing)}
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
                          <button
                            type="button"
                            className={
                              enableSorting && header.column.getCanSort()
                                ? "cursor-pointer select-none bg-transparent border-0 p-0 text-inherit font-inherit"
                                : "bg-transparent border-0 p-0 text-inherit font-inherit cursor-default"
                            }
                            onClick={() => {
                              if (enableSorting && header.column.getCanSort()) {
                                header.column.toggleSorting();
                              }
                            }}
                            disabled={!enableSorting || !header.column.getCanSort()}
                            aria-label={
                              enableSorting && header.column.getCanSort()
                                ? `Sort by ${header.column.columnDef.header}`
                                : undefined
                            }
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                            {renderSortIcon(header.column.getIsSorted())}
                          </button>
                          {renderFilterInput(header)}
                        </>
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {table.getRowModel().rows.map((row) => {
              const rowClassName = navigationAction
                ? "hover:bg-gray-200 transition-colors cursor-pointer"
                : "";
              
              return (
                <tr
                  key={row.id}
                  className={rowClassName}
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
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-center bg-navBorder w-full rounded p-2">
        <FontAwesomeIcon
          icon={faAngleLeft}
          onClick={() => table.previousPage()}
          className={`mr-2 cursor-pointer ${
            table.getCanPreviousPage()
              ? "text-defaultTextBlack"
              : "text-gray-400"
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
            table.getCanNextPage() ? "text-defaultTextBlack" : "text-gray-400"
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
