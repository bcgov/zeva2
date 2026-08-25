import { getModelYearEnumsToStringsMap } from "@/app/lib/utils/enumMaps";
import { ModelYear } from "@/prisma/generated/enums";
import Decimal from "decimal.js";

type BalanceProps =
  | {
      A?: Partial<Record<ModelYear, Decimal>>;
      B?: Partial<Record<ModelYear, Decimal>>;
    }
  | "deficit";

export const BalanceTable = ({ balance }: { balance: BalanceProps }) => {
  const section = (
    <section className="max-w-3xl overflow-hidden rounded-md border border-dividerMedium bg-white">
      <h2 className="border-b border-dividerMedium bg-disabledSurface px-5 py-4 text-xl font-semibold">
        Current Balance
      </h2>
      {balance === "deficit" ? (
        <p className="px-5 py-4 font-semibold text-error">Deficit</p>
      ) : (
        <BalanceRows balance={balance} />
      )}
    </section>
  );
  return section;
};

const BalanceRows = ({
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
    return <p className="px-5 py-4">No credit data.</p>;
  }

  const years = new Set<string>([
    ...Object.keys(aRecords ?? {}),
    ...Object.keys(bRecords ?? {}),
  ]);

  const sortedYears = Array.from(years).sort().reverse();
  const modelYearsMap = getModelYearEnumsToStringsMap();

  const totalA = Object.values(aRecords ?? {}).reduce(
    (sum, val) => (val ? sum.plus(val) : sum),
    new Decimal(0),
  );
  const totalB = Object.values(bRecords ?? {}).reduce(
    (sum, val) => (val ? sum.plus(val) : sum),
    new Decimal(0),
  );

  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b border-dividerMedium">
          <th className="px-5 py-4 text-left font-semibold">Year</th>
          <th className="px-5 py-4 text-left font-semibold">A Credits</th>
          <th className="px-5 py-4 text-left font-semibold">B Credits</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        <tr className="bg-infoBG">
          <td className="px-5 py-4 font-bold">Total Current ZEV Credits:</td>
          <td className="px-5 py-4">{totalA.toString()}</td>
          <td className="px-5 py-4">{totalB.toString()}</td>
        </tr>
        {sortedYears.map((y) => (
          <tr key={y} className="odd:bg-white even:bg-lightGrey">
            <td className="px-5 py-4">{modelYearsMap[y as ModelYear]}</td>
            <td className="px-5 py-4">
              {aRecords?.[y as ModelYear]?.toString() ?? "-"}
            </td>
            <td className="px-5 py-4">
              {bRecords?.[y as ModelYear]?.toString() ?? "-"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
