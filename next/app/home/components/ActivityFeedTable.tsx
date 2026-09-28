"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClientSideTable, Dropdown } from "@/app/lib/components";
import {
  dateOptionSplitter,
  SerializedActivityFeedRecord,
} from "../lib/constants";

export const ActivityFeedTable = (props: {
  records: SerializedActivityFeedRecord[];
  dateRangeOptions: [string, string][];
}) => {
  const router = useRouter();
  const [records, setRecords] = useState<SerializedActivityFeedRecord[]>(
    props.records,
  );
  const [activityTypeFilter, setActivityTypeFilter] = useState<string>();
  const [supplierFilter, setSupplierFilter] = useState<string>();
  const [recordTypeFilter, setRecordTypeFilter] = useState<string>();
  const [dateRangeFilter, setDateRangeFilter] = useState<[string, string]>();

  const navigationAction = useCallback(
    (_id: number, baseRoute?: string) => {
      if (baseRoute) {
        router.push(baseRoute);
      }
    },
    [router],
  );

  useEffect(() => {
    let filteredRecords: SerializedActivityFeedRecord[] = props.records;
    if (activityTypeFilter) {
      filteredRecords = filteredRecords.filter(
        (record) => record.activityType === activityTypeFilter,
      );
    }
    if (supplierFilter) {
      filteredRecords = filteredRecords.filter(
        (record) => record.supplier === supplierFilter,
      );
    }
    if (recordTypeFilter) {
      filteredRecords = filteredRecords.filter(
        (record) => record.recordType === recordTypeFilter,
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
  }, [
    props.records,
    activityTypeFilter,
    supplierFilter,
    recordTypeFilter,
    dateRangeFilter,
  ]);

  const headerFilters = useMemo(() => {
    const activityTypes = new Set<string>();
    const suppliers = new Set<string>();
    const recordTypes = new Set<string>();
    for (const record of props.records) {
      activityTypes.add(record.activityType);
      suppliers.add(record.supplier);
      recordTypes.add(record.recordType);
    }
    const emptyOption = [{ value: "", label: "" }];
    return (
      <div className="flex flex-row gap-6 items-center">
        <Dropdown
          label="Activity Type"
          options={[...emptyOption].concat(
            [...activityTypes].sort().map((type) => {
              return { value: type, label: type };
            }),
          )}
          value={activityTypeFilter || undefined}
          onChange={(value) => setActivityTypeFilter(value)}
        />
        <Dropdown
          label="Supplier"
          options={[...emptyOption].concat(
            [...suppliers].sort().map((supplier) => {
              return { value: supplier, label: supplier };
            }),
          )}
          value={supplierFilter || undefined}
          onChange={(value) => setSupplierFilter(value)}
        />
        <Dropdown
          label="Record Type"
          options={[...emptyOption].concat(
            [...recordTypes].sort().map((type) => {
              return { value: type, label: type };
            }),
          )}
          value={recordTypeFilter || undefined}
          onChange={(value) => setRecordTypeFilter(value)}
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
    activityTypeFilter,
    supplierFilter,
    recordTypeFilter,
    dateRangeFilter,
  ]);

  const columnHelper = createColumnHelper<SerializedActivityFeedRecord>();
  const columns = useMemo(() => {
    const result: ColumnDef<SerializedActivityFeedRecord, any>[] = [
      columnHelper.accessor((row) => row.activityType, {
        id: "activityType",
        enableSorting: false,
        enableColumnFilter: false,
        header: () => <span>Activity Type</span>,
      }),
      columnHelper.accessor((row) => row.id, {
        id: "id",
        enableSorting: false,
        enableColumnFilter: false,
        header: () => <span>Record ID</span>,
        cell: (info) => (
          <Link
            href={info.row.original.baseRoute}
            className="text-primaryBlue hover:underline"
            onClick={(event) => event.stopPropagation()}
          >
            {info.getValue()}
          </Link>
        ),
      }),
      columnHelper.accessor((row) => row.recordType, {
        id: "recordType",
        enableSorting: false,
        enableColumnFilter: false,
        header: () => <span>Record Type</span>,
      }),
      columnHelper.accessor((row) => row.supplier, {
        id: "supplier",
        enableSorting: false,
        enableColumnFilter: false,
        header: () => <span>Supplier</span>,
      }),
      columnHelper.accessor((row) => row.performedBy, {
        id: "performedBy",
        enableSorting: false,
        enableColumnFilter: false,
        header: () => <span>Performed By</span>,
      }),
      columnHelper.accessor((row) => row.dateTime, {
        id: "dateTime",
        enableSorting: false,
        enableColumnFilter: false,
        header: () => <span>Date and Time</span>,
      }),
    ];
    return result;
  }, [columnHelper]);

  return (
    <ClientSideTable<SerializedActivityFeedRecord>
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
