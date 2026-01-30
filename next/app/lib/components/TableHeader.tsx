"use client";

import * as React from "react";
import { Table } from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleDown, faAngleUp } from "@fortawesome/free-solid-svg-icons";
import { getSizingHeaders } from "@/app/lib/utils/tableUtils";

interface ITableHeaderProps<T> {
  table: Table<T>;
  explicitSizing?: boolean;
  stackHeaderContents?: boolean;
  enableSorting?: boolean;
  enableFiltering?: boolean;
  onSortChange?: (columnId: string) => void;
  onFilterChange?: (columnId: string, value: string) => void;
  sortState?: { [key: string]: "asc" | "desc" | null };
  filterState?: { [key: string]: string };
  filterOnApply?: boolean;
  onFilterApply?: () => void;
}

const renderSortIcon = (sortState: "asc" | "desc" | null) => {
  if (sortState === "asc") {
    return <FontAwesomeIcon icon={faAngleUp} className="mb-1" />;
  }
  if (sortState === "desc") {
    return <FontAwesomeIcon icon={faAngleDown} className="mb-1" />;
  }
  return null;
};

export const TableHeader = <T,>({
  table,
  explicitSizing,
  stackHeaderContents,
  enableSorting = false,
  enableFiltering = false,
  onSortChange,
  onFilterChange,
  sortState = {},
  filterState = {},
  filterOnApply = false,
  onFilterApply,
}: ITableHeaderProps<T>) => {
  return (
    <thead className="bg-gray-50">
      {explicitSizing && getSizingHeaders(table, explicitSizing)}
      {table.getHeaderGroups().map((headerGroup) => (
        <tr key={headerGroup.id}>
          {headerGroup.headers.map((header) => (
            <th
              key={header.id}
              className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                explicitSizing ? "truncate" : ""
              }`}
              style={
                explicitSizing ? { width: header.getSize() } : undefined
              }
            >
              <span
                className={`inline-flex gap-1 ${
                  stackHeaderContents ? "flex-col items-start" : "items-center"
                }`}
              >
                {header.isPlaceholder ? null : (
                  <>
                    <div
                      className={
                        (enableSorting && header.column.getCanSort()) ||
                        (!enableSorting && header.column.getCanSort())
                          ? "cursor-pointer select-none"
                          : ""
                      }
                      onClick={() => {
                        if (enableSorting && header.column.getCanSort()) {
                          onSortChange?.(header.id);
                        }
                      }}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                      {enableSorting &&
                        renderSortIcon(sortState[header.id] || null)}
                    </div>
                    {enableFiltering && header.column.getCanFilter() ? (
                      <div>
                        <input
                          className="w-36 border shadow-level-1 rounded"
                          onChange={(event) => {
                            onFilterChange?.(header.id, event.target.value);
                          }}
                          onKeyDown={(event) => {
                            if (filterOnApply && event.key === "Enter") {
                              onFilterApply?.();
                            }
                          }}
                          placeholder={
                            filterOnApply
                              ? "Press Enter to Search"
                              : "Filter..."
                          }
                          type="text"
                          value={filterState[header.id] ?? ""}
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
  );
};
