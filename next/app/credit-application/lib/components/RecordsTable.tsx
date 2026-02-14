"use client";

import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import {
  JSX,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { Button, ContentCard, Table } from "@/app/lib/components";
import { MapOfValidatedAndReasons, updateValidatedRecords } from "../actions";
import { useRouter } from "next/navigation";
import { getModelYearEnumsToStringsMap } from "@/app/lib/utils/enumMaps";
import { CreditApplicationRecordSparseSerialized } from "../utils";

export const RecordsTable = (props: {
  id: number;
  records: CreditApplicationRecordSparseSerialized[];
  totalNumbeOfRecords: number;
  readOnly: boolean;
}) => {
  const [mapOfData, setMapOfData] = useState<MapOfValidatedAndReasons>({});
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    const mapOfDataToSet: MapOfValidatedAndReasons = {};
    for (const record of props.records) {
      mapOfDataToSet[record.id] = [record.validated, record.reason];
    }
    setMapOfData(mapOfDataToSet);
  }, [props.records]);

  const getReasonsJSX = useCallback((id: number, reason: string | null) => {
    const reasons = [
      "Evidence provided",
      "Validated by other means as being registered in BC",
      "Error in ICBC data",
      "Other, explained in comments",
    ];
    const options: JSX.Element[] = [];
    reasons.forEach((reason) => {
      options.push(
        <option key={reason} value={reason}>
          {reason}
        </option>,
      );
    });
    return (
      <select
        value={reason ?? ""}
        onChange={(event) => {
          const targetValue = event.target.value;
          const newValue = targetValue ? targetValue : null;
          setMapOfData((prev) => {
            return { ...prev, [id]: [prev[id][0], newValue] };
          });
        }}
      >
        {options}
        <option key={"no reason"} value={""}></option>
      </select>
    );
  }, []);

  const handleValidateChange = useCallback((id: number) => {
    setMapOfData((prev) => {
      return { ...prev, [id]: [!prev[id][0], prev[id][1]] };
    });
  }, []);

  const handleSave = useCallback(() => {
    startTransition(async () => {
      const response = await updateValidatedRecords(props.id, mapOfData);
      if (response.responseType === "error") {
        console.error(response.message);
      } else {
        router.refresh();
      }
    });
  }, [props.id, mapOfData, router]);

  const modelYearsMap = useMemo(() => {
    return getModelYearEnumsToStringsMap();
  }, []);

  const getHighlighted = useCallback(
    (value: string | JSX.Element, warnings: string[]): string | JSX.Element => {
      if (warnings.length > 0) {
        return <div className="bg-yellow-200 truncate">{value}</div>;
      }
      return value;
    },
    [],
  );

  const columnHelper =
    createColumnHelper<CreditApplicationRecordSparseSerialized>();
  const columns = useMemo(() => {
    const result: ColumnDef<CreditApplicationRecordSparseSerialized, any>[] = [
      columnHelper.accessor((row) => row.vin, {
        id: "vin",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>VIN</span>,
        cell: (cellProps) => {
          return getHighlighted(
            cellProps.row.original.vin,
            cellProps.row.original.warnings,
          );
        },
        size: 230,
      }),
      columnHelper.accessor((row) => row.timestamp, {
        id: "timestamp",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>Date</span>,
        size: 150,
      }),
      columnHelper.accessor((row) => row.make, {
        id: "make",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>Make</span>,
        size: 100,
      }),
      columnHelper.accessor((row) => row.modelName, {
        id: "modelName",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>Model Name</span>,
        size: 150,
      }),
      columnHelper.accessor((row) => modelYearsMap[row.modelYear], {
        id: "modelYear",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>Model Year</span>,
        size: 100,
      }),
      columnHelper.accessor((row) => row.icbcMake, {
        id: "icbcMake",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>ICBC Make</span>,
        size: 100,
      }),
      columnHelper.accessor((row) => row.icbcModelName, {
        id: "icbcModelName",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>ICBC Model Name</span>,
        size: 150,
      }),
      columnHelper.accessor(
        (row) => (row.icbcModelYear ? modelYearsMap[row.icbcModelYear] : null),
        {
          id: "icbcModelYear",
          enableSorting: true,
          enableColumnFilter: true,
          header: () => <span>ICBC Model Year</span>,
          size: 100,
        },
      ),
      columnHelper.accessor((row) => row.warnings, {
        id: "warnings",
        enableSorting: true,
        enableColumnFilter: true,
        cell: (cellProps) => {
          const warnings = cellProps.row.original.warnings;
          return getHighlighted(warnings.join(", "), warnings);
        },
        header: () => <span>Warnings</span>,
        size: 125,
      }),
      columnHelper.accessor((row) => row.validated, {
        id: "validated",
        enableSorting: true,
        enableColumnFilter: true,
        cell: (cellProps) => {
          if (Object.keys(mapOfData).length === 0) {
            return null;
          }
          const id = cellProps.row.original.id;
          const warnings = cellProps.row.original.warnings;
          const value = (
            <input
              checked={mapOfData[id][0]}
              onChange={() => {
                handleValidateChange(id);
              }}
              type="checkbox"
              disabled={props.readOnly}
            />
          );
          return getHighlighted(value, warnings);
        },
        header: () => <span>Validated</span>,
        size: 75,
      }),
      columnHelper.accessor((row) => row.reason, {
        id: "reason",
        enableSorting: true,
        enableColumnFilter: true,
        cell: (cellProps) => {
          if (Object.keys(mapOfData).length === 0) {
            return null;
          }
          const id = cellProps.row.original.id;
          const reason = mapOfData[id][1];
          if (props.readOnly) {
            return cellProps.row.original.reason;
          }
          return getReasonsJSX(id, reason);
        },
        header: () => <span>Reason</span>,
        size: 500,
      }),
    ];
    return result;
  }, [
    columnHelper,
    props.records,
    props.readOnly,
    mapOfData,
    handleValidateChange,
    getReasonsJSX,
    modelYearsMap,
  ]);

  return (
    <div>
      <Table<CreditApplicationRecordSparseSerialized>
        columns={columns}
        data={props.records}
        totalNumberOfRecords={props.totalNumbeOfRecords}
        explicitSizing={true}
        paramsToPreserve={["readOnly"]}
        stackHeaderContents={true}
      />
      {!props.readOnly && (
        <ContentCard title="Actions">
          <Button variant="primary" onClick={handleSave} disabled={isPending}>
            {isPending ? "..." : "Save"}
          </Button>
        </ContentCard>
      )}
    </div>
  );
};
