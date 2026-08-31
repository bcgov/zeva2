"use client";

import { ClientSideTable } from "@/app/lib/components";
import { Dropdown } from "@/app/lib/components/inputs/Dropdown";
import { Routes } from "@/app/lib/constants";
import {
  getModelYearEnumsToStringsMap,
  getReferenceTypeEnumsToStringsMap,
  getTransactionTypeEnumsToStringMap,
  getVehicleClassEnumsToStringsMap,
  getZevClassEnumsToStringsMap,
} from "@/app/lib/utils/enumMaps";
import { ModelYear, ReferenceType } from "@/prisma/generated/enums";
import { createColumnHelper } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getBeginningBalance,
  getComplianceBounds,
  getEndingBalance,
  getTransactionsByComplianceYear,
} from "../actions";
import {
  SerializedZevUnitBalanceRecord,
  SerializedZevUnitTransaction,
} from "../constants";

type TransactionRow = {
  id: number;
  displayedId: string;
  type: string;
  referenceType: string;
  referenceId: string;
  legacyReferenceId: string;
  vehicleClass: string;
  zevClass: string;
  modelYear: string;
  numberOfUnits: string;
  date: string;
  link?: string;
};

export const TransactionTable = ({
  orgId,
  complianceYears,
}: {
  orgId: number;
  complianceYears: ModelYear[];
}) => {
  const router = useRouter();
  const [selectedYear, setSelectedYear] = useState<ModelYear>();
  const [complianceBounds, setComplianceBounds] = useState<[string, string]>();
  const [rows, setRows] = useState<TransactionRow[]>([]);
  const [error, setError] = useState("");

  const transactionTypes = useMemo(getTransactionTypeEnumsToStringMap, []);
  const referenceTypes = useMemo(getReferenceTypeEnumsToStringsMap, []);
  const vehicleClasses = useMemo(getVehicleClassEnumsToStringsMap, []);
  const zevClasses = useMemo(getZevClassEnumsToStringsMap, []);
  const modelYears = useMemo(getModelYearEnumsToStringsMap, []);

  const getReferenceLink = useCallback(
    (referenceType: ReferenceType, referenceId: number) => {
      if (referenceType === ReferenceType.SUPPLY_CREDITS) {
        return `${Routes.CreditApplications}/${referenceId}`;
      }
      if (referenceType === ReferenceType.TRANSFER) {
        return `${Routes.CreditTransfers}/${referenceId}`;
      }
      if (referenceType === ReferenceType.PENALTY_CREDITS) {
        return `${Routes.PenaltyCredits}/${referenceId}`;
      }
      if (
        referenceType === ReferenceType.COMPLIANCE_RATIO_REDUCTION ||
        referenceType === ReferenceType.ASSESSMENT_ADJUSTMENT
      ) {
        return `${Routes.ModelYearReports}/${referenceId}`;
      }
      if (referenceType === ReferenceType.AGREEMENT) {
        return `${Routes.CreditAgreements}/${referenceId}`;
      }
    },
    [],
  );

  const getBalanceRow = useCallback(
    (
      id: number,
      label: "Beginning Balance" | "Ending Balance",
      record: SerializedZevUnitBalanceRecord,
    ): TransactionRow => {
      return {
        id,
        displayedId: "—",
        type: `${label} ${transactionTypes[record.type] ?? record.type}`,
        referenceType: "—",
        referenceId: "—",
        legacyReferenceId: "—",
        vehicleClass:
          vehicleClasses[record.vehicleClass] ?? record.vehicleClass,
        zevClass: zevClasses[record.zevClass] ?? record.zevClass,
        modelYear: modelYears[record.modelYear] ?? record.modelYear,
        numberOfUnits: record.numberOfUnits,
        date: "—",
      };
    },
    [transactionTypes, vehicleClasses, zevClasses, modelYears],
  );

  const getTransactionRow = useCallback(
    (record: SerializedZevUnitTransaction): TransactionRow => {
      return {
        id: record.id,
        displayedId: record.id.toString(),
        type: transactionTypes[record.type] ?? record.type,
        referenceType:
          referenceTypes[record.referenceType] ?? record.referenceType,
        referenceId: record.referenceId?.toString() ?? "—",
        legacyReferenceId: record.legacyReferenceId?.toString() ?? "—",
        vehicleClass:
          vehicleClasses[record.vehicleClass] ?? record.vehicleClass,
        zevClass: zevClasses[record.zevClass] ?? record.zevClass,
        modelYear: modelYears[record.modelYear] ?? record.modelYear,
        numberOfUnits: record.numberOfUnits,
        date: record.timestamp,
        link: record.referenceId
          ? getReferenceLink(record.referenceType, record.referenceId)
          : undefined,
      };
    },
    [
      transactionTypes,
      referenceTypes,
      vehicleClasses,
      zevClasses,
      modelYears,
      getReferenceLink,
    ],
  );

  const loadTransactions = useCallback(
    async (year: ModelYear) => {
      setSelectedYear(year);
      setError("");
      const [beginning, transactions, ending, bounds] = await Promise.all([
        getBeginningBalance(orgId, year),
        getTransactionsByComplianceYear(orgId, year, "asc"),
        getEndingBalance(orgId, year),
        getComplianceBounds(year),
      ]);
      if (
        beginning.responseType !== "data" ||
        transactions.responseType !== "data" ||
        ending.responseType !== "data" ||
        bounds.responseType !== "data"
      ) {
        setRows([]);
        setError("Transactions could not be loaded.");
        return;
      }
      setComplianceBounds(bounds.data);
      const rowsToSet: TransactionRow[] = [];
      let counter = 0;
      for (const record of beginning.data) {
        rowsToSet.push(getBalanceRow(counter, "Beginning Balance", record));
        counter = counter - 1;
      }
      for (const record of transactions.data) {
        rowsToSet.push(getTransactionRow(record));
      }
      for (const record of ending.data) {
        rowsToSet.push(getBalanceRow(counter, "Ending Balance", record));
        counter = counter - 1;
      }
      setRows(rowsToSet);
    },
    [orgId, getBalanceRow, getTransactionRow],
  );

  useEffect(() => {
    if (complianceYears.length > 0) {
      loadTransactions(complianceYears[0]);
    }
  }, [complianceYears]);

  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<TransactionRow>();
    return [
      columnHelper.accessor("displayedId", { header: "ID" }),
      columnHelper.accessor("type", { header: "Type" }),
      columnHelper.accessor("referenceType", { header: "Reference Type" }),
      columnHelper.accessor("referenceId", { header: "Reference ID" }),
      columnHelper.accessor("legacyReferenceId", {
        header: "Legacy Reference ID",
      }),
      columnHelper.accessor("vehicleClass", { header: "Vehicle Class" }),
      columnHelper.accessor("zevClass", { header: "ZEV Class" }),
      columnHelper.accessor("modelYear", { header: "Model Year" }),
      columnHelper.accessor("numberOfUnits", { header: "Number of Units" }),
      columnHelper.accessor("date", { header: "Date" }),
    ];
  }, []);

  const yearOptions = useMemo(() => {
    return complianceYears.map((year) => ({
      value: year,
      label: modelYears[year] ?? year,
    }));
  }, []);

  if (complianceYears.length === 0) {
    return null;
  }
  return (
    <div className="rounded-md border border-dividerMedium bg-white">
      <div className="flex flex-row items-center justify-between gap-4 bg-disabledSurface px-5 py-4">
        <div>
          {selectedYear && complianceBounds && (
            <h2 className="text-xl font-semibold">
              Credit Transactions for the {modelYears[selectedYear]} Compliance
              Period ({complianceBounds[0]} to {complianceBounds[1]})
            </h2>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          {complianceYears.slice(0, 5).map((year) => (
            <button
              key={year}
              type="button"
              onClick={() => loadTransactions(year)}
              className={`m-0 min-w-16 rounded-md border px-4 py-3 text-sm font-semibold ${
                selectedYear === year
                  ? "border-primaryBlue bg-primaryBlue text-white"
                  : "border-dividerDark bg-white text-primaryText hover:bg-lightGrey"
              }`}
            >
              {modelYears[year] ?? year}
            </button>
          ))}
        </div>
      </div>

      <div className="p-5">
        {error && <p className="mb-4 text-error">{error}</p>}
        <ClientSideTable<TransactionRow>
          columns={columns}
          data={rows}
          enableGlobalSearch
          hideResetButton
          initialPageSize={10}
          navigationAction={(id) => {
            const link = rows.find((row) => row.id === id)?.link;
            if (link) {
              router.push(link);
            }
          }}
          headerContent={
            <div className="w-56">
              <Dropdown
                id="compliance-year"
                label="Compliance Year"
                options={yearOptions}
                value={selectedYear}
                onChange={(year) => loadTransactions(year as ModelYear)}
              />
            </div>
          }
          customStyles={{
            container: "bg-white border border-dividerMedium",
            theadTh:
              "whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-gray-700",
            tbodyTd: "whitespace-nowrap px-4 py-4 text-sm text-gray-900",
          }}
        />
      </div>
    </div>
  );
};
