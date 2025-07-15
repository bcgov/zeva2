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
import { ReasonsMap, updateValidatedRecords, ValidatedMap } from "../actions";
import { useRouter } from "next/navigation";
import { getModelYearEnumsToStringsMap } from "@/app/lib/utils/enumMaps";
import { CreditApplicationRecordSparseSerialized } from "../utils";

export const RecordsTable = (props: {
  id: number;
  records: CreditApplicationRecordSparseSerialized[];
  totalNumbeOfRecords: number;
  readOnly: boolean;
}) => {
  const [validatedMap, setValidatedMap] = useState<ValidatedMap>({});
  const [reasonsMap, setReasonsMap] = useState<ReasonsMap>({});
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    const mapOfValidated: Record<number, boolean> = {};
    const mapOfReasons: Record<number, string | null> = {};
    props.records.forEach((record) => {
      mapOfValidated[record.id] = record.validated;
      mapOfReasons[record.id] = record.reason;
    });
    setValidatedMap(mapOfValidated);
    setReasonsMap(mapOfReasons);
  }, [props.records]);

  const getReasonsJSX = useCallback((id: number, reason: string | null) => {
    const reasons = [
      "Evidence provided",
      "Validated by other means as being registered in BC",
      "Error in ICBC data",
      "VIN decoder, confirmed a ZEV",
      "VIN decoder, not a ZEV",
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
          setReasonsMap((prev) => {
            return { ...prev, [id]: newValue };
          });
        }}
      >
        {options}
        <option key={"no reason"} value={""}></option>
      </select>
    );
  }, []);

  const handleValidateChange = useCallback((id: number) => {
    setValidatedMap((prev) => {
      const prevValue = prev[id];
      return { ...prev, [id]: !prevValue };
    });
  }, []);

  const handleSave = useCallback(() => {
    startTransition(async () => {
      const response = await updateValidatedRecords(
        props.id,
        validatedMap,
        reasonsMap,
      );
      if (response.responseType === "error") {
        console.error(response.message);
      } else {
        router.refresh();
      }
    });
  }, [props.id, validatedMap, reasonsMap, router]);

  const modelYearsMap = useMemo(() => {
    return getModelYearEnumsToStringsMap();
  }, []);

  const columnHelper =
    createColumnHelper<CreditApplicationRecordSparseSerialized>();
  const columns = useMemo(() => {
    const result: ColumnDef<CreditApplicationRecordSparseSerialized, any>[] = [
      columnHelper.accessor((row) => row.vin, {
        id: "vin",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>VIN</span>,
      }),
      columnHelper.accessor((row) => row.timestamp, {
        id: "timestamp",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>Date</span>,
      }),
      columnHelper.accessor((row) => row.make, {
        id: "make",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>Make</span>,
      }),
      columnHelper.accessor((row) => row.modelName, {
        id: "modelName",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>Model Name</span>,
      }),
      columnHelper.accessor((row) => modelYearsMap[row.modelYear], {
        id: "modelYear",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>Model Year</span>,
      }),
      columnHelper.accessor((row) => row.icbcTimestamp, {
        id: "icbcTimestamp",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>ICBC File Date</span>,
      }),
      columnHelper.accessor((row) => row.icbcMake, {
        id: "icbcMake",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>ICBC Make</span>,
      }),
      columnHelper.accessor((row) => row.icbcModelName, {
        id: "icbcModelName",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>ICBC Model Name</span>,
      }),
      columnHelper.accessor(
        (row) => (row.icbcModelYear ? modelYearsMap[row.icbcModelYear] : null),
        {
          id: "icbcModelYear",
          enableSorting: true,
          enableColumnFilter: true,
          header: () => <span>ICBC Model Year</span>,
        },
      ),
      columnHelper.accessor((row) => row.warnings, {
        id: "warnings",
        enableSorting: true,
        enableColumnFilter: true,
        cell: (cellProps) => {
          return cellProps.row.original.warnings.join(", ");
        },
        header: () => <span>Warnings</span>,
      }),
      columnHelper.accessor((row) => row.validated, {
        id: "validated",
        enableSorting: true,
        enableColumnFilter: true,
        cell: (cellProps) => {
          const id = cellProps.row.original.id;
          let disabled = false;
          if (
            cellProps.row.original.warnings.some(
              (warning) => warning === "1" || warning === "51",
            )
          ) {
            disabled = true;
          }
          return (
            <input
              checked={validatedMap[id]}
              onChange={() => {
                handleValidateChange(id);
              }}
              type="checkbox"
              disabled={props.readOnly || disabled}
            />
          );
        },

        header: () => <span>Validated</span>,
      }),
      columnHelper.accessor((row) => row.reason, {
        id: "reason",
        enableSorting: true,
        enableColumnFilter: true,
        cell: (cellProps) => {
          const id = cellProps.row.original.id;
          const reason = reasonsMap[id];
          if (props.readOnly) {
            return cellProps.row.original.reason;
          }
          return getReasonsJSX(id, reason);
        },
        header: () => <span>Reason</span>,
      }),
    ];
    return result;
  }, [
    columnHelper,
    props.records,
    props.readOnly,
    validatedMap,
    handleValidateChange,
    reasonsMap,
    getReasonsJSX,
    modelYearsMap,
  ]);

  return (
    <div>
      <Table<CreditApplicationRecordSparseSerialized>
        columns={columns}
        data={props.records}
        totalNumberOfRecords={props.totalNumbeOfRecords}
      />
      {!props.readOnly && (
        <ContentCard title="Actions">
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? "..." : "Save"}
          </Button>
        </ContentCard>
      )}
    </div>
  );
};
