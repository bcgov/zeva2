import React from "react";

type Balance = Record<string, any>;

function strip(prefix: string, value: string) {
  return value.startsWith(prefix) ? value.slice(prefix.length) : value;
}

export default function BalanceTable({ balance }: { balance: Balance }) {
  const subtree = balance?.CREDIT?.REPORTABLE;
  if (!subtree) return <p>No credit data.</p>;

  const aRecords = subtree.A ?? {};
  const bRecords = subtree.B ?? {};

  const years = new Set<string>([
    ...Object.keys(aRecords),
    ...Object.keys(bRecords),
  ]);

  const sortedYears = Array.from(years).sort(
    (y1, y2) => Number(strip("MY_", y1)) - Number(strip("MY_", y2))
  );

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
            <td style={{ padding: "4px" }}>{strip("MY_", y)}</td>
            <td style={{ textAlign: "right", padding: "4px" }}>
              {aRecords[y]?.toString() ?? "—"}
            </td>
            <td style={{ textAlign: "right", padding: "4px" }}>
              {bRecords[y]?.toString() ?? "—"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
