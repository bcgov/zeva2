"use client";

import { Table, flexRender } from "@tanstack/react-table";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSort, faSortUp, faSortDown } from "@fortawesome/free-solid-svg-icons";
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
  customStyles?: {
    thead?: string;
    theadTr?: string;
    theadTh?: string;
  };
}

const renderSortIcon = (sortState: "asc" | "desc" | null) => {
  if (sortState === "asc") {
    return <FontAwesomeIcon icon={faSortUp} className="text-gray-600 hover:text-gray-800 transition-colors" />;
  }
  if (sortState === "desc") {
    return <FontAwesomeIcon icon={faSortDown} className="text-gray-600 hover:text-gray-800 transition-colors" />;
  }
  return <FontAwesomeIcon icon={faSort} className="text-gray-400 hover:text-gray-600 transition-colors" />;
};

const getButtonClassName = (
  enableSorting: boolean,
  canSort: boolean,
): string => {
  const baseClasses = "bg-transparent border-0 p-0 text-inherit font-inherit w-full text-left focus:outline-none focus-visible:outline-none focus:ring-0 active:bg-transparent hover:bg-transparent [&:hover]:text-inherit";
  const interactiveClass =
    enableSorting && canSort ? "cursor-pointer select-none" : "cursor-default";
  return `${baseClasses} ${interactiveClass}`;
};

const getSortAriaLabel = (
  enableSorting: boolean,
  canSort: boolean,
  headerName: string | undefined,
): string | undefined => {
  if (!enableSorting || !canSort) {
    return undefined;
  }
  return `Sort by ${headerName || ""}`;
};

const HeaderFilterInput = ({
  columnId,
  canFilter,
  value,
  filterOnApply,
  onFilterChange,
  onFilterApply,
}: {
  columnId: string;
  canFilter: boolean;
  value: string;
  filterOnApply: boolean;
  onFilterChange?: (columnId: string, value: string) => void;
  onFilterApply?: () => void;
}) => {
  if (!canFilter) return null;

  return (
    <div>
      <input
        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        onChange={(event) => {
          onFilterChange?.(columnId, event.target.value);
        }}
        onKeyDown={(event) => {
          if (filterOnApply && event.key === "Enter") {
            onFilterApply?.();
          }
        }}
        placeholder="Text"
        type="text"
        value={value}
      />
    </div>
  );
};

export const TableHeader = <T extends unknown>({
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
  customStyles,
}: ITableHeaderProps<T>) => {
  return (
    <thead className={customStyles?.thead || "bg-gray-50"}>
      {explicitSizing && getSizingHeaders(table, explicitSizing)}
      {table.getHeaderGroups().map((headerGroup) => (
        <>
          {/* Column Headers Row */}
          <tr key={`${headerGroup.id}-headers`} className={customStyles?.theadTr || "bg-white border-b border-gray-200"}>
            {headerGroup.headers.map((header) => {
              const thClassName = customStyles?.theadTh
                ? customStyles.theadTh
                : `px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider ${
                    explicitSizing ? "truncate" : ""
                  }`.trim();

              return (
                <th
                  key={header.id}
                  className={thClassName}
                  style={explicitSizing ? { width: header.getSize() } : undefined}
                >
                  {header.isPlaceholder ? null : (
                    <button
                      type="button"
                      className={`${getButtonClassName(
                        enableSorting,
                        header.column.getCanSort(),
                      )} flex items-center justify-between gap-2 w-full`}
                      onClick={() => {
                        if (enableSorting && header.column.getCanSort()) {
                          onSortChange?.(header.id);
                        }
                      }}
                      disabled={!enableSorting || !header.column.getCanSort()}
                      aria-label={getSortAriaLabel(
                        enableSorting,
                        header.column.getCanSort(),
                        typeof header.column.columnDef.header === "string"
                          ? header.column.columnDef.header
                          : header.id,
                      )}
                    >
                      <span>
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                      </span>
                      {enableSorting && header.column.getCanSort() &&
                        renderSortIcon(sortState[header.id] || null)}
                    </button>
                  )}
                </th>
              );
            })}
          </tr>
          {/* Filter Inputs Row */}
          {enableFiltering && (
            <tr key={`${headerGroup.id}-filters`} className="bg-gray-50 border-b-2 border-gray-300">
              {headerGroup.headers.map((header) => {
                const thClassName = customStyles?.theadTh
                  ? customStyles.theadTh
                  : `px-6 py-3 text-left ${explicitSizing ? "truncate" : ""}`.trim();

                return (
                  <th
                    key={header.id}
                    className={thClassName}
                    style={explicitSizing ? { width: header.getSize() } : undefined}
                  >
                    {header.isPlaceholder ? null : (
                      <HeaderFilterInput
                        columnId={header.id}
                        canFilter={header.column.getCanFilter()}
                        value={filterState[header.id] ?? ""}
                        filterOnApply={filterOnApply}
                        onFilterChange={onFilterChange}
                        onFilterApply={onFilterApply}
                      />
                    )}
                  </th>
                );
              })}
            </tr>
          )}
        </>
      ))}
    </thead>
  );
};
