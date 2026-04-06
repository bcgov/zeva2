"use client";

import { useCallback, useMemo, useState } from "react";
import { getEndingBalance, getTransactionsByComplianceYear } from "../actions";
import { useRouter } from "next/navigation";
import {
  getModelYearEnumsToStringsMap,
  getReferenceTypeEnumsToStringsMap,
  getTransactionTypeEnumsToStringMap,
  getVehicleClassEnumsToStringsMap,
  getZevClassEnumsToStringsMap,
} from "@/app/lib/utils/enumMaps";
import { ModelYear, ReferenceType } from "@/prisma/generated/enums";
import { Routes } from "@/app/lib/constants";
import {
  SerializedZevUnitEndingBalanceRecord,
  SerializedZevUnitTransaction,
} from "../constants";

export const TransactionAccordion = ({
  orgId,
  userIsGov,
  complianceYears,
}: {
  orgId: number;
  userIsGov: boolean;
  complianceYears: ModelYear[];
}) => {
  const [openYears, setOpenYears] = useState<ModelYear[]>([]);
  const [txCache, setTxCache] = useState<
    Partial<
      Record<
        ModelYear,
        [SerializedZevUnitTransaction[], SerializedZevUnitEndingBalanceRecord[]]
      >
    >
  >({});
  const router = useRouter();

  const toggleYear = useCallback(
    async (year: ModelYear) => {
      setOpenYears((prev) => {
        if (prev.includes(year)) {
          return prev.filter((y) => y !== year);
        }
        return [...prev, year];
      });
      if (!txCache[year]) {
        const [txResponse, endingBalanceResponse] = await Promise.all([
          getTransactionsByComplianceYear(orgId, year, "asc"),
          getEndingBalance(orgId, year),
        ]);
        if (
          txResponse.responseType === "data" &&
          endingBalanceResponse.responseType === "data"
        ) {
          setTxCache((prev) => ({
            ...prev,
            [year]: [txResponse.data, endingBalanceResponse.data],
          }));
        }
      }
    },
    [txCache, orgId],
  );

  const getLink = useCallback(
    (referenceType: ReferenceType, referenceId: number) => {
      if (referenceType === ReferenceType.SUPPLY_CREDITS) {
        return `${Routes.CreditApplication}/${referenceId}`;
      }
      if (referenceType === ReferenceType.TRANSFER) {
        return `${Routes.CreditTransfers}/${referenceId}`;
      }
      if (userIsGov && referenceType === ReferenceType.PENALTY_CREDITS) {
        return `${Routes.PenaltyCredit}/${referenceId}`;
      }
      if (
        referenceType === ReferenceType.COMPLIANCE_RATIO_REDUCTION ||
        referenceType === ReferenceType.ASSESSMENT_ADJUSTMENT
      ) {
        return `${Routes.ComplianceReporting}/${referenceId}`;
      }
      if (referenceType === ReferenceType.AGREEMENT) {
        return `${Routes.CreditAgreements}/${referenceId}`;
      }
    },
    [userIsGov],
  );

  const transactionTypesMap = useMemo(() => {
    return getTransactionTypeEnumsToStringMap();
  }, []);

  const referenceTypesMap = useMemo(() => {
    return getReferenceTypeEnumsToStringsMap();
  }, []);

  const vehicleClassesMap = useMemo(() => {
    return getVehicleClassEnumsToStringsMap();
  }, []);

  const zevClassesMap = useMemo(() => {
    return getZevClassEnumsToStringsMap();
  }, []);

  const modelYearsMap = useMemo(() => {
    return getModelYearEnumsToStringsMap();
  }, []);

  if (complianceYears.length === 0) {
    return null;
  }
  return (
    <div>
      {complianceYears.map((y) => (
        <div
          key={y}
          style={{
            border: "1px solid #ccc",
            borderRadius: 4,
            marginBottom: 8,
            overflow: "hidden",
          }}
        >
          <button
            onClick={() => toggleYear(y)}
            style={{
              width: "100%",
              padding: "8px 12px",
              textAlign: "left",
              border: "none",
              fontWeight: 600,
            }}
          >
            {openYears.includes(y) ? "▾" : "▸"} Compliance&nbsp;Year&nbsp;
            {modelYearsMap[y]}
          </button>

          {openYears.includes(y) && (
            <div style={{ padding: 8 }}>
              {!txCache[y] ? (
                "Loading…"
              ) : txCache[y][0].length === 0 ? (
                "No records for this compliance year."
              ) : (
                <table
                  style={{
                    borderCollapse: "collapse",
                    width: "100%",
                    fontSize: 14,
                  }}
                >
                  <thead>
                    <tr>
                      {[
                        "ID",
                        "Type",
                        "Reference Type",
                        "Reference ID",
                        "Legacy reference ID",
                        "Vehicle Class",
                        "ZEV Class",
                        "Model Year",
                        "Number of Units",
                        "Date",
                      ].map((h) => (
                        <th
                          key={h}
                          style={{
                            textAlign: "left",
                            borderBottom: "1px solid #ddd",
                            padding: "4px",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {txCache[y][0].map((t) => {
                      const className = t.referenceId ? "cursor-pointer" : "";
                      const onClick = () => {
                        if (t.referenceId) {
                          const link = getLink(t.referenceType, t.referenceId);
                          if (link) {
                            router.push(link);
                          }
                        }
                      };
                      return (
                        <tr key={t.id} className={className} onClick={onClick}>
                          <td style={{ padding: "4px" }}>{t.id}</td>
                          <td style={{ padding: "4px" }}>
                            {transactionTypesMap[t.type]}
                          </td>
                          <td style={{ padding: "4px" }}>
                            {referenceTypesMap[t.referenceType]}
                          </td>
                          <td style={{ padding: "4px" }}>{t.referenceId}</td>
                          <td style={{ padding: "4px" }}>
                            {t.legacyReferenceId}
                          </td>
                          <td style={{ padding: "4px" }}>
                            {vehicleClassesMap[t.vehicleClass]}
                          </td>
                          <td style={{ padding: "4px" }}>
                            {zevClassesMap[t.zevClass]}
                          </td>
                          <td style={{ padding: "4px" }}>
                            {modelYearsMap[t.modelYear]}
                          </td>
                          <td style={{ padding: "4px" }}>{t.numberOfUnits}</td>
                          <td style={{ padding: "4px" }}>{t.timestamp}</td>
                        </tr>
                      );
                    })}
                    {txCache[y][1].map((eb, index) => {
                      return (
                        <tr
                          key={`eb=${eb.id}`}
                          className={
                            index === 0 ? "border-t border-gray-300" : ""
                          }
                        >
                          <td style={{ padding: "4px" }}>--</td>
                          <td style={{ padding: "4px" }}>
                            {`Ending Balance ${transactionTypesMap[eb.type]}`}
                          </td>
                          <td style={{ padding: "4px" }}>--</td>
                          <td style={{ padding: "4px" }}>--</td>
                          <td style={{ padding: "4px" }}>--</td>
                          <td style={{ padding: "4px" }}>
                            {vehicleClassesMap[eb.vehicleClass]}
                          </td>
                          <td style={{ padding: "4px" }}>
                            {zevClassesMap[eb.zevClass]}
                          </td>
                          <td style={{ padding: "4px" }}>
                            {modelYearsMap[eb.modelYear]}
                          </td>
                          <td style={{ padding: "4px" }}>
                            {eb.finalNumberOfUnits}
                          </td>
                          <td style={{ padding: "4px" }}>--</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
