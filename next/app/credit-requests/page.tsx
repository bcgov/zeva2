"use client";

import React from 'react';
import { Table } from '../lib/components';
import { fetchUnitTransactions } from './data';

export default function CreditTransfer() {
  const [data, setData] = React.useState([]);
  React.useEffect(() => {
    fetchUnitTransactions().then((res) => {
      setData(res);
    });
  }, []);
  return (
    <Table data={data} />
  );
}
