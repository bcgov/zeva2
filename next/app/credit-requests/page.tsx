
"use client";

import React from 'react';
import { Table } from '../lib/components';
import { createColumnHelper } from '@tanstack/react-table';
import { ZevUnitTransfer } from '@/prisma/generated/client';

export default function CreditTransfer() {
  const [data, setData] = React.useState<ZevUnitTransfer[]>([]);
  const columnHelper = createColumnHelper<ZevUnitTransfer>();

  const columns = React.useMemo(() => [
    columnHelper.accessor('id', {
      id: 'id',
      cell: info => <i>{info.getValue()}</i>,
      header: () => <span>ID</span>,
    }),
    columnHelper.accessor('transferToId', {
      id: 'lastName',
      cell: info => <i>{info.getValue()}</i>,
      header: () => <span>To</span>,
    }),
    columnHelper.accessor('transferFromId', {
      header: () => 'From',
      cell: info => info.renderValue(),
    }),
    columnHelper.accessor('status', {
      header: () => <span>Status</span>,
      cell: info => info.renderValue(),
    }),
  ], [columnHelper]);

  React.useEffect(() => {
    async function fetchData() {
      const res = await fetch('/api/unit-transactions');
      const json = await res.json();
      setData(json);
    }
    fetchData();
  }, []);

  return <Table data={data} columns={columns} pageSize={10} />;
}
