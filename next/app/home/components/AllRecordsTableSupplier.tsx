"use client";

import { useCallback, useMemo, useState } from "react";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { ClientSideTable, Dropdown } from "@/app/lib/components";
import { useRouter } from "next/navigation";
import {
  dateOptionSplitter,
  SerializedAllRecordsRecordSupplier,
} from "../lib/constants";

const columnHelper = createColumnHelper<SerializedAllRecordsRecordSupplier>();

const columns: ColumnDef<SerializedAllRecordsRecordSupplier, any>[] = [
  columnHelper.accessor((row) => row.id.toString(), {
    id: "id",
    enableSorting: false,
    enableColumnFilter: false,
    header: () => <span>Record ID</span>,
  }),
  columnHelper.accessor((row) => row.type, {
    id: "type",
    enableSorting: false,
    enableColumnFilter: false,
    header: () => <span>Record Type</span>,
  }),
  columnHelper.accessor((row) => row.status, {
    id: "status",
    enableSorting: false,
    enableColumnFilter: false,
    header: () => <span>Status</span>,
  }),
  columnHelper.accessor((row) => row.lastUpdated, {
    id: "lastUpdated",
    enableSorting: false,
    enableColumnFilter: false,
    header: () => <span>Last Updated</span>,
  }),
  columnHelper.accessor((row) => row.date, {
    id: "date",
    enableSorting: false,
    enableColumnFilter: false,
    header: () => <span>Date</span>,
  }),
];

export const AllRecordsTableSupplier = (props: {
  records: SerializedAllRecordsRecordSupplier[];
  dateRangeOptions: [string, string][];
}) => {
  const router = useRouter();
  const [typeFilter, setTypeFilter] = useState<string>();
  const [statusFilter, setStatusFilter] = useState<string>();
  const [dateRangeFilter, setDateRangeFilter] = useState<[string, string]>();

  const navigationAction = useCallback(
    (id: number, baseRoute?: string) => {
      if (baseRoute) {
        router.push(`${baseRoute}/${id}`);
      }
    },
    [router],
  );

  const records = useMemo(
    () =>
      props.records.filter(
        (record) =>
          (!typeFilter || record.type === typeFilter) &&
          (!statusFilter || record.status === statusFilter) &&
          (!dateRangeFilter ||
            (record.date >= dateRangeFilter[0] &&
              record.date <= dateRangeFilter[1])),
      ),
    [props.records, typeFilter, statusFilter, dateRangeFilter],
  );

  const headerFilters = useMemo(() => {
    const statuses = new Set<string>();
    const types = new Set<string>();
    for (const record of props.records) {
      statuses.add(record.status);
      types.add(record.type);
    }
    const emptyOption = [{ value: "", label: "" }];
    const toOptions = (values: Set<string>) =>
      emptyOption.concat(
        [...values].sort().map((value) => ({ value, label: value })),
      );
    return (
      <div className="flex flex-row gap-6 items-center">
        <Dropdown
          label="Status"
          options={toOptions(statuses)}
          value={statusFilter || undefined}
          onChange={(value) => setStatusFilter(value)}
        />
        <Dropdown
          label="Record Type"
          options={toOptions(types)}
          value={typeFilter || undefined}
          onChange={(value) => setTypeFilter(value)}
        />
        <Dropdown
          label="Date Range"
          options={emptyOption.concat(
            props.dateRangeOptions.map((option) => ({
              value: option.join(dateOptionSplitter),
              label: option.join(dateOptionSplitter),
            })),
          )}
          value={dateRangeFilter?.join(dateOptionSplitter)}
          onChange={(value) => {
            if (!value) {
              setDateRangeFilter(undefined);
            } else {
              const split = value.split(dateOptionSplitter);
              setDateRangeFilter([split[0], split[1]]);
            }
          }}
        />
      </div>
    );
  }, [
    props.records,
    props.dateRangeOptions,
    statusFilter,
    typeFilter,
    dateRangeFilter,
  ]);

  return (
    <ClientSideTable<SerializedAllRecordsRecordSupplier>
      columns={columns}
      data={records}
      navigationAction={navigationAction}
      stackHeaderContents={true}
      enableFiltering={false}
      enableSorting={false}
      enableGlobalSearch={true}
      headerFilters={headerFilters}
      hideResetButton={true}
    />
  );
};
