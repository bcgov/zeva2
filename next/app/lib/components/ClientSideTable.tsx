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
import { TableHeader } from "./TableHeader";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
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
          <TableHeader
            table={table}
            explicitSizing={explicitSizing}
            stackHeaderContents={stackHeaderContents}
            enableSorting={enableSorting}
            enableFiltering={enableFiltering}
            onSortChange={(columnId) => {
              const column = table.getColumn(columnId);
              if (column?.getCanSort()) {
                column.toggleSorting();
              }
            }}
            onFilterChange={(columnId, value) => {
              const column = table.getColumn(columnId);
              if (column) {
                column.setFilterValue(value);
              }
            }}
            sortState={sorting.reduce((acc, sort) => {
              acc[sort.id] = sort.desc ? "desc" : "asc";
              return acc;
            }, {} as { [key: string]: "asc" | "desc" })}
            filterState={columnFilters.reduce((acc, filter) => {
              acc[filter.id] = (filter.value as string) ?? "";
              return acc;
            }, {} as { [key: string]: string })}
          />
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
