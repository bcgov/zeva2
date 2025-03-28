
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
import { Show } from './layout';
import { usePathname, useRouter } from 'next/navigation';

export interface ITableProps<T extends object = {}> {
  columns: ColumnDef<T, any>[];
  data: T[];
  pageSize?: number;
  footer?: boolean;
}

export const Table = <T extends object>({ columns, data, pageSize, footer }: ITableProps<T>) => {
  const router = useRouter();
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

  const pathname = usePathname();

  const handleNavigation = (id: string) => {
    const newPath = `${pathname}/${id}`;
    router.push(newPath);
  };

  return (
    <div className="p-2">
      <table className="min-w-full divide-y divide-gray-200 rounded border-t border-l border-r border-navBorder">
        <thead className="bg-gray-50">
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler()}
                  className="cursor-pointer px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  <span className='inline-flex items-center gap-1'>
                    {header.isPlaceholder ? null : (
                      <>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() === 'asc'
                          ? <FaUpLong size={10} className='mb-1' />
                          : header.column.getIsSorted() === 'desc'
                            ? <FaDownLong size={10} className='mb-1' />
                            : ''}
                      </>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {rows.map(row => (
            <tr key={row.id} className='hover:bg-gray-200 transition-colors cursor-pointer' onClick={() => handleNavigation(row.id)}>
              {row.getVisibleCells().map(cell => (
                <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        <Show when={!!footer}>
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
        </Show>
      </table>
      {pageSize && (
        <div className="flex items-center justify-center bg-navBorder w-full rounded p-2">
          <FaArrowLeft
            onClick={() => table.getCanPreviousPage() && table.previousPage()}
            className='mr-2 text-defaultTextBlack cursor-pointer'
          />
          <span className="text-sm text-gray-700">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <FaArrowRight
            onClick={() => table.getCanNextPage() && table.nextPage()}
            className='ml-2 text-defaultTextBlack cursor-pointer'
          />
        </div>
      )
      }
    </div >
  );
};
