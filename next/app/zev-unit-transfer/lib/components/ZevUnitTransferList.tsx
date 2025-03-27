
import React from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { Table } from '@/app/lib/components';
import { getZevUnitTransfers, ZevUnitTransferWithContentAndOrgs } from '../data';

export default async function ZevUnitTransferList() {
  const [data, setData] = React.useState<ZevUnitTransferWithContentAndOrgs[]>([]);
  const columnHelper = createColumnHelper<ZevUnitTransferWithContentAndOrgs>();
  const transfers = await getZevUnitTransfers();

  const columns = React.useMemo(() => [
    columnHelper.accessor('id', {
      id: 'id',
      cell: info => <i>{info.getValue()}</i>,
      header: () => <span>ID</span>,
    }),
    columnHelper.accessor('transferFrom.name', {
      id: 'From',
      cell: info => <i>{info.getValue()}</i>,
      header: () => <span>To</span>,
    }),
    columnHelper.accessor('transferTo.name', {
      header: () => 'To',
      cell: info => info.renderValue(),
    }),
    columnHelper.accessor('zevUnitTransferContent.numberOfUnits.e', {
      header: () => <span>Status</span>,
      cell: info => info.renderValue(),
    }),
  ], [columnHelper]);

  return <Table data={data} columns={columns} pageSize={10} />;
}
