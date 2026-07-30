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
import { createPortal } from "react-dom";
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
  warningDescriptions,
} from "../constants";
import { ModelYear } from "@/prisma/generated/enums";
import { isModelYear } from "@/app/lib/utils/typeGuards";

const WarningCode = ({
  code,
  description,
}: {
  code: string;
  description: string;
}) => {
  const [tooltipPos, setTooltipPos] = useState<{
    x: number;
    y: number;
  } | null>(null);

  return (
    <>
      <span
        className="inline-flex items-center gap-0.5 cursor-default"
        onMouseEnter={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top });
        }}
        onMouseLeave={() => setTooltipPos(null)}
      >
        {code}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="inline h-3.5 w-3.5 text-gray-500"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z"
            clipRule="evenodd"
          />
        </svg>
      </span>
      {tooltipPos &&
        createPortal(
          <div
            style={{
              position: "fixed",
              left: tooltipPos.x,
              top: tooltipPos.y - 8,
              transform: "translate(-50%, -100%)",
              zIndex: 9999,
            }}
            className="rounded-lg bg-black px-4 py-3 text-sm font-medium text-white shadow-lg pointer-events-none"
          >
            {description}
          </div>,
          document.body,
        )}
    </>
  );
};

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
      mapOfDataToSet[record.id] = [record.validated, record.reason || ""];
    }
    setMapOfData(mapOfDataToSet);
  }, [props.records]);

  const getReasonsJSX = useCallback((id: number, reason: string) => {
    const reasons = [
      "",
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
        value={reason}
        onChange={(value) => {
          setMapOfData((prev) => {
            let data = prev[id];
            if (data) {
              let newValidationStatus = data[0];
              if (value) {
                if (isValidReason(value)) {
                  newValidationStatus = true;
                } else if (isInvalidReason(value)) {
                  newValidationStatus = false;
                }
              }
              return { ...prev, [id]: [newValidationStatus, value] };
            }
            return prev;
          });
        }}
      />
    );
  }, []);

  const handleValidateChange = useCallback((id: number) => {
    setMapOfData((prev) => {
      let data = prev[id];
      if (data) {
        return { ...prev, [id]: [!data[0], data[1]] };
      }
      return prev;
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
          const content = (
            <div className="flex flex-wrap gap-1">
              {warnings.map((code) => (
                <WarningCode
                  key={code}
                  code={code}
                  description={warningDescriptions[code] ?? `Warning ${code}`}
                />
              ))}
            </div>
          );
          return getHighlighted(content, warnings);
        },
        header: () => <span>Warnings</span>,
        size: 125,
      }),
      columnHelper.accessor((row) => row.validated, {
        id: "validated",
        enableSorting: true,
        enableColumnFilter: true,
        cell: (cellProps) => {
          const id = cellProps.row.original.id;
          if (!mapOfData[id]) {
            return null;
          }
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
          const id = cellProps.row.original.id;
          if (!mapOfData[id]) {
            return null;
          }
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
        defaultPageSize={100}
        explicitSizing={true}
        paramsToPreserve={["readOnly"]}
        stackHeaderContents={true}
        noTruncateCols={["reason", "warnings"]}
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
