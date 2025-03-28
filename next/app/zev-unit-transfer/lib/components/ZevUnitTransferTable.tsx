"use client";

import React, { useMemo } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { Table } from '@/app/lib/components';
import { ZevUnitTransferWithContentAndOrgs } from '../data';

interface Props {
  transfers: ZevUnitTransferWithContentAndOrgs[];
}

/**
* Component that defines the columns / structure of ZevUnitTransferTable 
**/
export default function ZevUnitTransferTable({ transfers }: Props) {
  const columnHelper = createColumnHelper<ZevUnitTransferWithContentAndOrgs>();

  const columns = useMemo(() => [
    columnHelper.accessor((row) => row.id, {
      id: 'id',
      enableSorting: true,
      cell: (info) => <i>{info.getValue()}</i>,
      header: () => <span>ID</span>,
    }),
    columnHelper.accessor((row) => row.transferFrom.name, {
      id: 'transferFrom',
      enableSorting: true,
      cell: (info) => <i>{info.getValue()}</i>,
      header: () => <span>From</span>,
    }),
    columnHelper.accessor((row) => row.transferTo.name, {
      id: 'transferTo',
      cell: (info) => info.renderValue(),
      enableSorting: true,
      header: () => <span>To</span>,
    }),
    columnHelper.accessor((row) => row.status, {
      id: 'status',
      enableSorting: true,
      cell: (info) => info.renderValue(),
      header: () => <span>Status</span>,
    }),
  ], [columnHelper]);

  return <Table data={transfers} columns={columns} pageSize={10} />;
}
