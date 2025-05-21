import { getModelYearEnumMap } from "@/app/lib/utils/enumMaps";
import { ZevUnitRecordsObj } from "@/lib/utils/zevUnit";
import { ModelYear } from "@/prisma/generated/client";
import React from "react";

export default function BalanceTable({
  balance,
}: {
  balance: ZevUnitRecordsObj;
}) {
  const subtree = balance?.CREDIT?.REPORTABLE;
  if (!subtree) return <p>No credit data.</p>;

  const aRecords = subtree.A ?? {};
  const bRecords = subtree.B ?? {};

  const years = new Set<string>([
    ...Object.keys(aRecords),
    ...Object.keys(bRecords),
  ]);

  const sortedYears = Array.from(years).sort().reverse();
  const modelYearsMap = getModelYearEnumMap();

  return (
    <table style={{ borderCollapse: "collapse", minWidth: "20rem" }}>
      <thead>
        <tr>
          <th style={{ textAlign: "left", padding: "4px" }}>Year</th>
          <th style={{ textAlign: "right", padding: "4px" }}>A credits</th>
          <th style={{ textAlign: "right", padding: "4px" }}>B credits</th>
        </tr>
      </thead>
      <tbody>
        {sortedYears.map((y) => (
          <tr key={y}>
            <td style={{ padding: "4px" }}>{modelYearsMap[y]}</td>
            <td style={{ textAlign: "right", padding: "4px" }}>
              {aRecords[y as ModelYear]?.toString() ?? "—"}
            </td>
            <td style={{ textAlign: "right", padding: "4px" }}>
              {bRecords[y as ModelYear]?.toString() ?? "—"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
