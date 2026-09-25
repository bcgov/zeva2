"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { ClientSideTable, Dropdown } from "@/app/lib/components";
import { useRouter } from "next/navigation";
import {
  dateOptionSplitter,
  SerializedAllRecordsRecord,
} from "../lib/constants";

export const AllRecordsTable = (props: {
  records: SerializedAllRecordsRecord[];
  dateRangeOptions: [string, string][];
  userIsGov: boolean;
}) => {
  const router = useRouter();
  const [records, setRecords] = useState<SerializedAllRecordsRecord[]>(
    props.records,
  );
  const [typeFilter, setTypeFilter] = useState<string>();
  const [statusFilter, setStatusFilter] = useState<string>();
  // first entry in pair is lower bound date, second entry is upper bound date; dates are YYYY-MM-DD strings
  const [dateRangeFilter, setDateRangeFilter] = useState<[string, string]>();
  const navigationAction = useCallback((id: number, baseRoute?: string) => {
    if (baseRoute) {
      router.push(`${baseRoute}/${id}`);
    }
  }, []);

  useEffect(() => {
    let filteredRecords: SerializedAllRecordsRecord[] = props.records;
    if (typeFilter) {
      filteredRecords = filteredRecords.filter(
        (record) => record.type === typeFilter,
      );
    }
    if (statusFilter) {
      filteredRecords = filteredRecords.filter(
        (record) => record.status === statusFilter,
      );
    }
    if (dateRangeFilter) {
      filteredRecords = filteredRecords.filter(
        (record) =>
          record.date >= dateRangeFilter[0] &&
          record.date <= dateRangeFilter[1],
      );
    }
    setRecords(filteredRecords);
  }, [props.records, typeFilter, statusFilter, dateRangeFilter]);

  const headerFilters = useMemo(() => {
    const statuses = new Set<string>();
    const types = new Set<string>();
    for (const record of props.records) {
      statuses.add(record.status);
      types.add(record.type);
    }
    const emptyOption = [{ value: "", label: "" }];
    return (
      <div className="flex flex-row gap-6 items-center">
        <Dropdown
          label="Status"
          options={[...emptyOption].concat(
            [...statuses].sort().map((type) => {
              return { value: type, label: type };
            }),
          )}
          value={statusFilter || undefined}
          onChange={(value) => setStatusFilter(value)}
        />
        <Dropdown
          label="Record Type"
          options={[...emptyOption].concat(
            [...types].sort().map((type) => {
              return { value: type, label: type };
            }),
          )}
          value={typeFilter || undefined}
          onChange={(value) => setTypeFilter(value)}
        />
        <Dropdown
          label="Date Range"
          options={[...emptyOption].concat(
            props.dateRangeOptions.map((option) => {
              return {
                value: option.join(dateOptionSplitter),
                label: option.join(dateOptionSplitter),
              };
            }),
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

  const columnHelper = createColumnHelper<SerializedAllRecordsRecord>();
  const columns = useMemo(() => {
    const result: ColumnDef<SerializedAllRecordsRecord, any>[] = [
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
      ...(props.userIsGov
        ? [
            columnHelper.accessor((row) => row.supplier, {
              id: "supplier",
              enableSorting: false,
              enableColumnFilter: false,
              header: () => <span>Supplier</span>,
            }),
          ]
        : []),
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
      ...(props.userIsGov
        ? [
            columnHelper.accessor((row) => row.lastUpdatedBy, {
              id: "lastUpdatedBy",
              enableSorting: false,
              enableColumnFilter: false,
              header: () => <span>Last Updated By</span>,
            }),
          ]
        : []),
      columnHelper.accessor((row) => row.date, {
        id: "date",
        enableSorting: false,
        enableColumnFilter: false,
        header: () => <span>Date</span>,
      }),
    ];
    return result;
  }, [columnHelper]);

  return (
    <ClientSideTable<SerializedAllRecordsRecord>
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
