
import React from 'react';
import { getZevUnitTransfers } from '../data';
import ZevUnitTransferTable from './ZevUnitTransferTable';

export default async function ZevUnitTransferList() {
  const transfers = await getZevUnitTransfers();
  return <ZevUnitTransferTable transfers={transfers} />;
}
