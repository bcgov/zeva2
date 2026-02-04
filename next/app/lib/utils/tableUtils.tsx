import * as React from "react";
import { Table } from "@tanstack/react-table";

/**
 * Generates sizing headers for tables with explicit column sizing.
 * This is used to enable column resizing functionality.
 */
export const getSizingHeaders = <T,>(
  table: Table<T>,
  explicitSizing: boolean,
): React.JSX.Element | null => {
  if (!explicitSizing) {
    return null;
  }
  const lastGroup = table.getHeaderGroups().at(-1);
  if (!lastGroup) {
    return null;
  }
  const sizingHeaders: React.JSX.Element[] = lastGroup.headers.map((header) => (
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
  ));
  if (sizingHeaders) {
    return <tr key={"sizingHeaders"}>{sizingHeaders}</tr>;
  }
  return null;
};
