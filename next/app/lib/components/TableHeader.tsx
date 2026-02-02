"use client";

import { Table, flexRender } from "@tanstack/react-table";
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

const getButtonClassName = (
  enableSorting: boolean,
  canSort: boolean,
): string => {
  const baseClasses = "bg-transparent border-0 p-0 text-inherit font-inherit";
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
        className="w-36 border shadow-level-1 rounded"
        onChange={(event) => {
          onFilterChange?.(columnId, event.target.value);
        }}
        onKeyDown={(event) => {
          if (filterOnApply && event.key === "Enter") {
            onFilterApply?.();
          }
        }}
        placeholder={filterOnApply ? "Press Enter to Search" : "Filter..."}
        type="text"
        value={value}
      />
    </div>
  );
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
                    <button
                      type="button"
                      className={getButtonClassName(
                        enableSorting,
                        header.column.getCanSort(),
                      )}
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
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                      {enableSorting &&
                        renderSortIcon(sortState[header.id] || null)}
                    </button>
                    {enableFiltering && (
                      <HeaderFilterInput
                        columnId={header.id}
                        canFilter={header.column.getCanFilter()}
                        value={filterState[header.id] ?? ""}
                        filterOnApply={filterOnApply}
                        onFilterChange={onFilterChange}
                        onFilterApply={onFilterApply}
                      />
                    )}
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
