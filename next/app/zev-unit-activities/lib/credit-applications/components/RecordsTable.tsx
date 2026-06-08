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
import { Button, Table, Dropdown } from "@/app/lib/components";
import {
  invalidateRecords,
  MapOfValidatedAndReasons,
  updateValidatedRecords,
} from "../actions";
import { useRouter } from "next/navigation";
import { getModelYearEnumsToStringsMap } from "@/app/lib/utils/enumMaps";
import {
  CreditApplicationRecordSparseSerialized,
  InvalidReason,
  isInvalidReason,
  isValidReason,
  ValidReason,
} from "../constants";
import { ModelYear } from "@/prisma/generated/enums";
import { isModelYear } from "@/app/lib/utils/typeGuards";

export const RecordsTable = (props: {
  id: number;
  records: CreditApplicationRecordSparseSerialized[];
  totalNumbeOfRecords: number;
  modelYears: ModelYear[];
  readOnly: boolean;
}) => {
  const [mapOfData, setMapOfData] = useState<MapOfValidatedAndReasons>({});
  const [isPending, startTransition] = useTransition();
  const [modelYearSelection, setModelYearSelection] = useState<ModelYear>();
  const [error, setError] = useState<string>("");
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
      ...Object.values(ValidReason),
      ...Object.values(InvalidReason),
    ];
    return (
      <Dropdown
        placeholder=""
        options={reasons.map((reason) => ({
          value: reason,
          label: reason,
        }))}
        value={reason ?? ""}
        onChange={(value) => {
          const newValue = value ? value : null;
          setMapOfData((prev) => {
            let newValidationStatus = prev[id][0];
            if (newValue) {
              if (isValidReason(newValue)) {
                newValidationStatus = true;
              } else if (isInvalidReason(newValue)) {
                newValidationStatus = false;
              }
            }
            return { ...prev, [id]: [newValidationStatus, newValue] };
          });
        }}
      />
    );
  }, []);

  const handleValidateChange = useCallback((id: number) => {
    setMapOfData((prev) => {
      return { ...prev, [id]: [!prev[id][0], prev[id][1]] };
    });
  }, []);

  const handleSave = useCallback(() => {
    setError("");
    startTransition(async () => {
      const response = await updateValidatedRecords(props.id, mapOfData);
      if (response.responseType === "error") {
        setError(response.message);
      } else {
        router.refresh();
      }
    });
  }, [props.id, mapOfData]);

  const modelYearsMap = useMemo(() => {
    return getModelYearEnumsToStringsMap();
  }, []);

  const modelYearOptions = useMemo(() => {
    return props.modelYears.map((my) => {
      return {
        value: my,
        label: modelYearsMap[my] ?? "",
      };
    });
  }, [props.modelYears, modelYearsMap]);

  const handleSelectMy = useCallback((value: string) => {
    if (isModelYear(value)) {
      setModelYearSelection(value);
    }
  }, []);

  const handleInvalidateByMy = useCallback(() => {
    setError("");
    if (modelYearSelection) {
      startTransition(async () => {
        const response = await invalidateRecords(props.id, modelYearSelection);
        if (response.responseType === "error") {
          setError(response.message);
        } else {
          router.refresh();
        }
      });
    }
  }, [props.id, modelYearSelection]);

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
      columnHelper.accessor((row) => row.icbcRegistrationTimestamp, {
        id: "icbcRegistrationTimestamp",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>ICBC Registration Date</span>,
        size: 150,
      }),
      columnHelper.accessor((row) => row.decodedMake, {
        id: "decodedMake",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>Decoded Make</span>,
        size: 100,
      }),
      columnHelper.accessor((row) => row.decodedModelName, {
        id: "decodedModelName",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>Decoded Model Name</span>,
        size: 150,
      }),
      columnHelper.accessor(
        (row) =>
          row.decodedModelYear ? modelYearsMap[row.decodedModelYear] : null,
        {
          id: "decodedModelYear",
          enableSorting: true,
          enableColumnFilter: true,
          header: () => <span>Decoded Model Year</span>,
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
    <div className="flex flex-col gap-4">
      <Table<CreditApplicationRecordSparseSerialized>
        columns={columns}
        data={props.records}
        totalNumberOfRecords={props.totalNumbeOfRecords}
        explicitSizing={true}
        paramsToPreserve={["readOnly"]}
        stackHeaderContents={true}
        noTruncateCols={["reason"]}
      />
      {!props.readOnly && (
        <div className="p-4 flex flex-row justify-between bg-gray-100 items-center">
          <div className="flex flex-row gap-4">
            <Dropdown
              options={modelYearOptions}
              value={modelYearSelection}
              onChange={handleSelectMy}
              disabled={isPending}
            />
            <Button
              variant="secondary"
              onClick={handleInvalidateByMy}
              disabled={isPending}
            >
              {isPending
                ? "..."
                : "Invalidate validated records associated with the selected Model Year"}
            </Button>
          </div>
          <div className="flex flex-row gap-4">
            {error && <span className="text-red-600">{error}</span>}
            <Button variant="primary" onClick={handleSave} disabled={isPending}>
              {isPending ? "..." : "Save"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
