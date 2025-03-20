
"use client";

import React from 'react';
import { Table } from '../lib/components';
import { createColumnHelper } from '@tanstack/react-table';
import { ZevUnitTransfer, ZevUnitTransferStatuses } from '@/prisma/generated/client';

export default function CreditTransfer() {
  const [data, setData] = React.useState<ZevUnitTransfer[]>([]);
  const columnHelper = createColumnHelper<ZevUnitTransfer>();

  const testData: ZevUnitTransfer[] = [
    { id: 0, transferToId: 1, transferFromId: 2, status: ZevUnitTransferStatuses.DRAFT },
    { id: 1, transferToId: 3, transferFromId: 4, status: ZevUnitTransferStatuses.APPROVED },
  ];


  const columns = React.useMemo(() => [
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

  return <Table data={testData} columns={columns} pageSize={10} />;
}
