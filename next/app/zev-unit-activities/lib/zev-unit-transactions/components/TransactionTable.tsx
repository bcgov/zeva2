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
import { useEffect, useMemo, useState } from "react";
import {
  getBeginningBalance,
  getEndingBalance,
  getTransactionsByComplianceYear,
} from "../actions";

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

const getReferenceLink = (referenceType: ReferenceType, referenceId: number) => {
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
};

export const TransactionTable = ({
  orgId,
  complianceYears,
}: {
  orgId: number;
  complianceYears: ModelYear[];
}) => {
  const router = useRouter();
  const [selectedYear, setSelectedYear] = useState(complianceYears[0]);
  const [rows, setRows] = useState<TransactionRow[]>([]);
  const [loading, setLoading] = useState(complianceYears.length > 0);
  const [error, setError] = useState("");

  const transactionTypes = useMemo(getTransactionTypeEnumsToStringMap, []);
  const referenceTypes = useMemo(getReferenceTypeEnumsToStringsMap, []);
  const vehicleClasses = useMemo(getVehicleClassEnumsToStringsMap, []);
  const zevClasses = useMemo(getZevClassEnumsToStringsMap, []);
  const modelYears = useMemo(getModelYearEnumsToStringsMap, []);

  useEffect(() => {
    if (!selectedYear) return;
    let cancelled = false;
    setLoading(true);
    setError("");

    Promise.all([
      getBeginningBalance(orgId, selectedYear),
      getTransactionsByComplianceYear(orgId, selectedYear, "asc"),
      getEndingBalance(orgId, selectedYear),
    ])
      .then(([beginning, transactions, ending]) => {
        if (cancelled) return;
        if (
          beginning.responseType !== "data" ||
          transactions.responseType !== "data" ||
          ending.responseType !== "data"
        ) {
          setRows([]);
          setError("Transactions could not be loaded.");
          setLoading(false);
          return;
        }

        const balanceRow = (
          record: (typeof beginning.data)[number],
          label: "Beginning Balance" | "Ending Balance",
          index: number,
        ): TransactionRow => ({
          id:
            label === "Beginning Balance"
              ? -1000000 - index
              : -2000000 - index,
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
        });

        setRows([
          ...beginning.data.map((record, index) =>
            balanceRow(record, "Beginning Balance", index),
          ),
          ...transactions.data.map((record) => ({
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
          })),
          ...ending.data.map((record, index) =>
            balanceRow(record, "Ending Balance", index),
          ),
        ]);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setRows([]);
          setError("Transactions could not be loaded.");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    modelYears,
    orgId,
    referenceTypes,
    selectedYear,
    transactionTypes,
    vehicleClasses,
    zevClasses,
  ]);

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

  if (complianceYears.length === 0) return null;

  const yearOptions = complianceYears.map((year) => ({
    value: year,
    label: modelYears[year] ?? year,
  }));

  return (
    <section className="overflow-hidden rounded-md border border-dividerMedium bg-white">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-disabledSurface px-5 py-4">
        <div>
          <h2 className="text-xl font-semibold">
            Credit Transactions by Compliance Year
          </h2>
          <p className="mt-1 text-sm">Each compliance year runs from October 1.</p>
        </div>
        <div className="flex flex-wrap gap-3" aria-label="Recent compliance years">
          {complianceYears.slice(0, 5).map((year) => (
            <button
              key={year}
              type="button"
              onClick={() => setSelectedYear(year)}
              aria-pressed={selectedYear === year}
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
        {loading ? (
          <p className="py-8 text-center text-sm text-gray-600">Loading…</p>
        ) : (
          <ClientSideTable<TransactionRow>
            columns={columns}
            data={rows}
            enableGlobalSearch
            enableSorting
            hideResetButton
            initialPageSize={10}
            navigationAction={(id) => {
              const link = rows.find((row) => row.id === id)?.link;
              if (link) router.push(link);
            }}
            headerContent={
              <div className="w-56">
                <Dropdown
                  id="compliance-year"
                  label="Compliance Year"
                  options={yearOptions}
                  value={selectedYear}
                  onChange={(year) => setSelectedYear(year as ModelYear)}
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
        )}
      </div>
    </section>
  );
};
