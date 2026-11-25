import Decimal from "decimal.js";
import { getUserInfo } from "@/auth";
import { CreditTransferStatus, ZevClass } from "@/prisma/generated/enums";
import { getReportableBalanceABU } from "../../zev-unit-transactions/data";
import { CreditTransferWithContent } from "../services";

const pendingStatuses: CreditTransferStatus[] = [
  CreditTransferStatus.DRAFT,
  CreditTransferStatus.SUBMITTED_TO_TRANSFER_TO,
  CreditTransferStatus.APPROVED_BY_TRANSFER_TO,
  CreditTransferStatus.RECOMMEND_APPROVAL_GOV,
  CreditTransferStatus.RECOMMEND_REJECTION_GOV,
  CreditTransferStatus.RETURNED_TO_ANALYST,
];

const formatBalance = (value: Decimal) =>
  value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

export const CreditTransferBalances = async ({
  transfer,
}: {
  transfer: CreditTransferWithContent & {
    transferFrom: { name: string };
    transferTo: { name: string };
  };
}) => {
  const { userIsGov, userOrgId } = await getUserInfo();
  const isPending = pendingStatuses.includes(transfer.status);
  // Filter before querying so supplier views never fetch their partner's balance.
  const suppliers = [
    {
      id: transfer.transferFromId,
      name: transfer.transferFrom.name,
      direction: -1,
    },
    { id: transfer.transferToId, name: transfer.transferTo.name, direction: 1 },
  ].filter((supplier) => userIsGov || supplier.id === userOrgId);

  const tables = await Promise.all(
    suppliers.map(async (supplier) => {
      const { credits } = await getReportableBalanceABU(supplier.id);
      const rows = [ZevClass.A, ZevClass.B].map((category) => {
        const current = new Decimal(credits[category]);
        const change = isPending
          ? transfer.creditTransferContent
              .filter((line) => line.zevClass === category)
              .reduce(
                (sum, line) => sum.plus(line.numberOfUnits),
                new Decimal(0),
              )
              .times(supplier.direction)
          : new Decimal(0);
        return { category, current, change, after: current.plus(change) };
      });
      return (
        <section
          key={supplier.id}
          className="min-w-0 rounded border border-dividerMedium"
        >
          <h3 className="rounded-t bg-disabledSurface px-5 py-4 text-xl font-bold">
            {supplier.name} Credit Balance{isPending ? " Preview" : ""}
          </h3>
          <div className="overflow-x-auto p-5">
            <div className="overflow-hidden rounded border border-dividerMedium">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">
                  {supplier.name} credit balance
                </caption>
                <thead>
                  <tr className="border-b border-dividerMedium">
                    <th scope="col" className="px-4 py-3">
                      Category
                    </th>
                    <th scope="col" className="px-4 py-3">
                      {isPending ? "Current Balance" : "Credit Balance"}
                    </th>
                    {isPending && (
                      <th scope="col" className="px-4 py-3">
                        Change
                      </th>
                    )}
                    {isPending && (
                      <th scope="col" className="px-4 py-3">
                        Credit Balance After Transfer
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ category, current, change, after }) => (
                    <tr
                      key={category}
                      className={`border-b border-dividerMedium last:border-b-0 odd:bg-lightGrey ${change.isZero() ? "" : "font-bold"}`}
                    >
                      <th scope="row" className="px-4 py-3 font-[inherit]">
                        {category}
                      </th>
                      <td className="px-4 py-3">{formatBalance(current)}</td>
                      {isPending && (
                        <td
                          className={`px-4 py-3 ${change.isNegative() ? "text-error" : change.isPositive() ? "text-success" : ""}`}
                        >
                          {change.isPositive() ? "+" : ""}
                          {change.isZero() ? "0" : formatBalance(change)}
                        </td>
                      )}
                      {isPending && (
                        <td className="px-4 py-3">{formatBalance(after)}</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      );
    }),
  );

  return (
    <div
      className={`grid gap-5 px-5 pb-5 ${userIsGov ? "lg:grid-cols-2" : "grid-cols-1"}`}
    >
      {tables}
    </div>
  );
};
