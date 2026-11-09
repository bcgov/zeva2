import { getModelYearEnumsToStringsMap } from "@/app/lib/utils/enumMaps";
import { ModelYear } from "@/prisma/generated/enums";
import Decimal from "decimal.js";

export const BalanceTable = ({
  balance,
}: {
  balance: {
    debits: {
      A: Partial<Record<ModelYear, Decimal>>;
      B: Partial<Record<ModelYear, Decimal>>;
      Unspecified: Partial<Record<ModelYear, Decimal>>;
    };
    credits: {
      A: Partial<Record<ModelYear, Decimal>>;
      B: Partial<Record<ModelYear, Decimal>>;
      Unspecified: Partial<Record<ModelYear, Decimal>>;
    };
  };
}) => {
  const aDebits = balance.debits.A;
  const bDebits = balance.debits.B;
  const unspecifiedDebits = balance.debits.Unspecified;
  const aCredits = balance.credits.A;
  const bCredits = balance.credits.B;
  const unspecifiedCredits = balance.credits.Unspecified;

  const debitYears = new Set<string>([
    ...Object.keys(aDebits),
    ...Object.keys(bDebits),
    ...Object.keys(unspecifiedDebits),
  ]);

  const creditYears = new Set<string>([
    ...Object.keys(aCredits),
    ...Object.keys(bCredits),
    ...Object.keys(unspecifiedCredits),
  ]);

  const sortedDebitYears = Array.from(debitYears).sort().reverse();
  const sortedCreditYears = Array.from(creditYears).sort().reverse();
  const modelYearsMap = getModelYearEnumsToStringsMap();

  const getTotalUnits = (units: Partial<Record<ModelYear, Decimal>>) => {
    return Object.values(units).reduce(
      (sum, val) => sum.plus(val),
      new Decimal(0),
    );
  };

  const totalADebits = getTotalUnits(aDebits);
  const totalBDebits = getTotalUnits(bDebits);
  const totalUnspecifiedDebits = getTotalUnits(unspecifiedDebits);
  const totalACredits = getTotalUnits(aCredits);
  const totalBCredits = getTotalUnits(bCredits);
  const totalUnspecifiedCredits = getTotalUnits(unspecifiedCredits);

  return (
    <section className="max-w-3xl overflow-hidden rounded-md border border-dividerMedium bg-white">
      <h2 className="border-b border-dividerMedium bg-disabledSurface px-5 py-4 text-xl font-semibold">
        Current Balance
      </h2>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="px-5 py-4 text-left font-semibold">
              Compliance Year
            </th>
            <th className="px-5 py-4 text-left font-semibold">A Units</th>
            <th className="px-5 py-4 text-left font-semibold">B Units</th>
            <th className="px-5 py-4 text-left font-semibold">
              Unspecified Units
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 border-t border-b border-dividerMedium">
          <tr className="border-b border-dividerMedium bg-infoBG">
            <td className="px-5 py-4 font-bold">Total Current ZEV Debits:</td>
            <td className="px-5 py-4">
              {totalADebits.equals(0) ? (
                "0.00"
              ) : (
                <span className="text-error">-{totalADebits.toFixed(2)}</span>
              )}
            </td>
            <td className="px-5 py-4">
              {totalBDebits.equals(0) ? (
                "0.00"
              ) : (
                <span className="text-error">-{totalBDebits.toFixed(2)}</span>
              )}
            </td>
            <td className="px-5 py-4">
              {totalUnspecifiedDebits.equals(0) ? (
                "0.00"
              ) : (
                <span className="text-error">
                  -{totalUnspecifiedDebits.toFixed(2)}
                </span>
              )}
            </td>
          </tr>
          {sortedDebitYears.map((y) => (
            <tr key={y} className="odd:bg-white even:bg-gray-50">
              <td className="px-5 py-4">{modelYearsMap[y as ModelYear]}</td>
              <td className="px-5 py-4">
                {aDebits[y as ModelYear] ? (
                  <span className="text-error">
                    -{aDebits[y as ModelYear]?.toString()}
                  </span>
                ) : (
                  "—"
                )}
              </td>
              <td className="px-5 py-4">
                {bDebits[y as ModelYear] ? (
                  <span className="text-error">
                    -{bDebits[y as ModelYear]?.toString()}
                  </span>
                ) : (
                  "—"
                )}
              </td>
              <td className="px-5 py-4">
                {unspecifiedDebits[y as ModelYear] ? (
                  <span className="text-error">
                    -{unspecifiedDebits[y as ModelYear]?.toString()}
                  </span>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
        </tbody>
        <tbody className="divide-y divide-gray-100">
          <tr className="border-b border-dividerMedium bg-infoBG">
            <td className="px-5 py-4 font-bold">Total Current ZEV Credits:</td>
            <td className="px-5 py-4">{totalACredits.toFixed(2)}</td>
            <td className="px-5 py-4">{totalBCredits.toFixed(2)}</td>
            <td className="px-5 py-4">{totalUnspecifiedCredits.toFixed(2)}</td>
          </tr>
          {sortedCreditYears.map((y) => (
            <tr key={y} className="odd:bg-white even:bg-gray-50">
              <td className="px-5 py-4">{modelYearsMap[y as ModelYear]}</td>
              <td className="px-5 py-4">
                {aCredits[y as ModelYear]?.toString() ?? "—"}
              </td>
              <td className="px-5 py-4">
                {bCredits[y as ModelYear]?.toString() ?? "—"}
              </td>
              <td className="px-5 py-4">
                {unspecifiedCredits[y as ModelYear]?.toString() ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
};
