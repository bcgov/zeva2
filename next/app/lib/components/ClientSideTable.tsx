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
import { Dropdown } from "./inputs/Dropdown";
import { TableHeader } from "./TableHeader";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAngleLeft,
  faAngleRight,
  faMagnifyingGlass,
} from "@fortawesome/free-solid-svg-icons";

interface IClientSideTableProps<T> {
  columns: ColumnDef<T, any>[];
  data: T[];
  navigationAction?: (id: number) => void;
  explicitSizing?: boolean;
  stackHeaderContents?: boolean;
  enableFiltering?: boolean;
  enableSorting?: boolean;
  enableGlobalSearch?: boolean;
  initialPageSize?: number;
  customStyles?: {
    container?: string;
    headerSection?: string;
    searchSection?: string;
    tableWrapper?: string;
    table?: string;
    thead?: string;
    theadTr?: string;
    theadTh?: string;
    tbody?: string;
    tbodyTr?: string;
    tbodyTd?: string;
    pagination?: string;
  };
  hideResetButton?: boolean;
  title?: string;
  headerContent?: React.ReactNode;
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
  enableGlobalSearch = false,
  initialPageSize = 10,
  customStyles,
  hideResetButton = false,
  title,
  headerContent,
}: IClientSideTableProps<T>) => {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [globalFilter, setGlobalFilter] = React.useState("");
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
      globalFilter,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
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
    setGlobalFilter("");
    setPagination({
      pageIndex: 0,
      pageSize: initialPageSize,
    });
  };

  return (
    <div>
      {(title || headerContent || enableGlobalSearch || !hideResetButton) && (
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {headerContent && <div>{headerContent}</div>}
            {enableGlobalSearch && (
              <div className="relative w-80">
                <FontAwesomeIcon
                  icon={faMagnifyingGlass}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Example text"
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
          </div>
          {!hideResetButton && (
            <Button variant="secondary" size="small" onClick={handleReset}>
              Reset Table
            </Button>
          )}
        </div>
      )}
      <div
        className={
          customStyles?.container ||
          "bg-white rounded-lg border-2 border-gray-300"
        }
      >
        <div className={customStyles?.tableWrapper || "overflow-x-auto"}>
          <table
            className={
              customStyles?.table ||
              `w-full ${explicitSizing ? "table-fixed" : ""}`
            }
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
              sortState={sorting.reduce(
                (acc, sort) => {
                  acc[sort.id] = sort.desc ? "desc" : "asc";
                  return acc;
                },
                {} as { [key: string]: "asc" | "desc" },
              )}
              filterState={columnFilters.reduce(
                (acc, filter) => {
                  acc[filter.id] = (filter.value as string) ?? "";
                  return acc;
                },
                {} as { [key: string]: string },
              )}
              customStyles={{
                thead: customStyles?.thead,
                theadTr: customStyles?.theadTr,
                theadTh: customStyles?.theadTh,
              }}
            />
            <tbody
              className={
                customStyles?.tbody || "bg-white divide-y divide-gray-100"
              }
            >
              {table.getRowModel().rows.map((row, index) => {
                const isEven = index % 2 === 0;
                const rowClassName =
                  customStyles?.tbodyTr ||
                  `${isEven ? "bg-white" : "bg-gray-50"} ${
                    navigationAction
                      ? "hover:bg-blue-50 transition-colors cursor-pointer"
                      : ""
                  }`;

                return (
                  <tr
                    key={row.id}
                    className={rowClassName}
                    onClick={() => handleNavigation(row.original.id)}
                  >
                    {row.getVisibleCells().map((cell) => {
                      return (
                        <td
                          key={cell.id}
                          className={
                            customStyles?.tbodyTd ||
                            `px-6 py-4 text-sm text-gray-900 ${explicitSizing ? "truncate" : ""}`
                          }
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
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div
          className={
            customStyles?.pagination ||
            "flex items-center justify-between bg-gray-50 border-t border-gray-300 px-6 py-3"
          }
        >
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md ${
              table.getCanPreviousPage()
                ? "text-white bg-primaryBlue hover:bg-primaryBlueHover"
                : "text-gray-400 bg-gray-200 cursor-not-allowed"
            }`}
          >
            <FontAwesomeIcon icon={faAngleLeft} />
            Previous Page
          </button>

          <div className="flex items-center gap-2">
            {Array.from({ length: table.getPageCount() }, (_, i) => i + 1).map(
              (page) => {
                const isCurrentPage =
                  table.getState().pagination.pageIndex + 1 === page;
                return (
                  <button
                    key={page}
                    onClick={() => table.setPageIndex(page - 1)}
                    className={`min-w-[40px] h-[40px] px-3 py-2 text-sm font-semibold rounded-md ${
                      isCurrentPage
                        ? "bg-primaryBlue text-white"
                        : "text-gray-700 bg-white hover:bg-gray-100 border border-gray-300"
                    }`}
                  >
                    {page}
                  </button>
                );
              },
            )}
          </div>

          <div className="flex items-center gap-3">
            <Dropdown
              options={[5, 10, 25, 50, 100].map((pageSize) => ({
                value: pageSize.toString(),
                label: `${pageSize} rows`,
              }))}
              value={table.getState().pagination.pageSize.toString()}
              onChange={(value) => {
                table.setPageSize(Number(value));
              }}
              className="inline-block w-32"
            />
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md ${
                table.getCanNextPage()
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
