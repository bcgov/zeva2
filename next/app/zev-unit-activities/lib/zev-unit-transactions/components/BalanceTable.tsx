import { getModelYearEnumsToStringsMap } from "@/app/lib/utils/enumMaps";
import { ModelYear } from "@/prisma/generated/enums";
import Decimal from "decimal.js";

export const BalanceTable = ({
  balance,
}: {
  balance: {
    A?: Partial<Record<ModelYear, Decimal>>;
    B?: Partial<Record<ModelYear, Decimal>>;
  };
}) => {
  const aRecords = balance.A;
  const bRecords = balance.B;

  if (!aRecords && !bRecords) {
    return <p>No credit data.</p>;
  }

  const years = new Set<string>([
    ...Object.keys(aRecords ?? {}),
    ...Object.keys(bRecords ?? {}),
  ]);

  const sortedYears = Array.from(years).sort().reverse();
  const modelYearsMap = getModelYearEnumsToStringsMap();

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
            <td style={{ padding: "4px" }}>{modelYearsMap[y as ModelYear]}</td>
            <td style={{ textAlign: "right", padding: "4px" }}>
              {aRecords?.[y as ModelYear]?.toString() ?? "—"}
            </td>
            <td style={{ textAlign: "right", padding: "4px" }}>
              {bRecords?.[y as ModelYear]?.toString() ?? "—"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
