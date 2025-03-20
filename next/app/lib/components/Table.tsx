
"use client";

import * as React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { FaArrowLeft, FaArrowRight, FaDownLong, FaUpLong } from 'react-icons/fa6';

export interface ITableProps<T extends object = {}> {
  columns: ColumnDef<T, any>[];
  data: T[];
  pageSize?: number;
}

export const Table = <T extends object>({ columns, data, pageSize }: ITableProps<T>) => {
  const table = useReactTable({
    data,
    columns,
    initialState: pageSize
      ? { pagination: { pageSize }, sorting: [] }
      : { sorting: [] },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const rows = pageSize
    ? table.getPaginationRowModel().rows
    : table.getRowModel().rows;

  return (
    <div className="p-2">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler()}
                  className="cursor-pointer px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {header.isPlaceholder ? null : (
                    <>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      <span>
                        {header.column.getIsSorted() === 'asc'
                          ? <FaUpLong />
                          : header.column.getIsSorted() === 'desc'
                            ? <FaDownLong />
                            : ''}
                      </span>
                    </>
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {rows.map(row => (
            <tr key={row.id}>
              {row.getVisibleCells().map(cell => (
                <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-gray-50">
          {table.getFooterGroups().map(footerGroup => (
            <tr key={footerGroup.id}>
              {footerGroup.headers.map(header => (
                <th
                  key={header.id}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.footer, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </tfoot>
      </table>
      {pageSize && (
        <div className="flex items-center mt-2 justify-self-center">
          <FaArrowLeft
            onClick={() => table.getCanPreviousPage() && table.previousPage()}
            className='mr-2'
          />
          <span className="text-sm text-gray-700">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <FaArrowRight
            onClick={() => table.getCanNextPage() && table.nextPage()}
            className='ml-2'
          />
        </div>
      )
      }
    </div >
  );
};
