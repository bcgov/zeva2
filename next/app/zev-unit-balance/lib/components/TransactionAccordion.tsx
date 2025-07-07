"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getTransactionsByComplianceYear,
  getComplianceYears,
  SerializedZevUnitTransaction,
} from "../actions";
import { useRouter } from "next/navigation";
import { getReferenceTypeEnumsToStringsMap } from "@/app/lib/utils/enumMaps";
import { ReferenceType } from "@/prisma/generated/client";
import { Routes } from "@/app/lib/constants";

export default function TransactionAccordion({
  orgId,
  userIsGov,
}: {
  orgId: number;
  userIsGov: boolean;
}) {
  const [years, setYears] = useState<number[] | null>(null);
  const [openYear, setOpenYear] = useState<number | null>(null);
  const [txCache, setTxCache] = useState<
    Record<number, SerializedZevUnitTransaction[]>
  >({});
  const router = useRouter();

  useEffect(() => {
    (async () => setYears(await getComplianceYears(orgId)))();
  }, [orgId]);

  const toggleYear = async (y: number) => {
    setOpenYear((prev) => (prev === y ? null : y));
    if (!txCache[y]) {
      const tx = await getTransactionsByComplianceYear(orgId, y, "desc");
      setTxCache((prev) => ({ ...prev, [y]: tx }));
    }
  };

  const referenceTypesMap = useMemo(() => {
    return getReferenceTypeEnumsToStringsMap();
  }, []);

  const getLink = useCallback(
    (referenceType: ReferenceType, referenceId: number) => {
      if (referenceType === ReferenceType.SUPPLY_CREDITS) {
        return `${Routes.CreditApplication}/${referenceId}`;
      }
      if (referenceType === ReferenceType.TRANSFER) {
        return `${Routes.CreditTransactions}/${referenceId}`;
      }
      if (userIsGov && referenceType === ReferenceType.PENALTY_CREDITS) {
        return `${Routes.PenaltyCredit}/${referenceId}`;
      }
    },
    [userIsGov],
  );

  if (!years) return <>Loading years…</>;
  if (years.length === 0) return <>No transactions found.</>;

  return (
    <div>
      {years.map((y) => (
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
            {openYear === y ? "▾" : "▸"} Compliance&nbsp;Year&nbsp;{y}
          </button>

          {openYear === y && (
            <div style={{ padding: 8 }}>
              {!txCache[y] ? (
                "Loading…"
              ) : txCache[y].length === 0 ? (
                "No transactions for this compliance year."
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
                        "Units",
                        "Class",
                        "Model Year",
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
                    {txCache[y].map((t) => {
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
                          <td style={{ padding: "4px" }}>{t.type}</td>
                          <td style={{ padding: "4px" }}>
                            {referenceTypesMap[t.referenceType]}
                          </td>
                          <td style={{ padding: "4px" }}>{t.referenceId}</td>
                          <td style={{ padding: "4px" }}>
                            {t.legacyReferenceId}
                          </td>
                          <td style={{ padding: "4px" }}>
                            {t.numberOfUnits.toString()}
                          </td>
                          <td style={{ padding: "4px" }}>{t.zevClass}</td>
                          <td style={{ padding: "4px" }}>
                            {t.modelYear.replace("MY_", "")}
                          </td>
                          <td style={{ padding: "4px" }}>{t.timestamp}</td>
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
}
