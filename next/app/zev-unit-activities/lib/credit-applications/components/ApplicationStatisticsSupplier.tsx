import { getApplicationStatisticsSupplier } from "../services";

export const ApplicationStatisticsSupplier = async (props: {
  creditApplicationId: number;
  orgId: number;
}) => {
  const { type, vinsStatRecords, creditsStatRecords } =
    await getApplicationStatisticsSupplier(
      props.creditApplicationId,
      props.orgId,
    );

  return (
    <div className="flex flex-col gap-6 p-5">
      <div className="flex flex-col border-t border-l border-r border-disabledIcon rounded-t">
        <div className="flex flex-col px-5 py-4 bg-disabledSurface font-bold">
          {type === "claimed" && "VINs Claimed"}
          {type === "issued" && "VINs Issued"}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="h-[60px] px-4 py-3 text-left font-bold border-b border-disabledIcon whitespace-nowrap">
                  Make
                </th>
                <th className="h-[60px] px-4 py-3 text-left font-bold border-b border-disabledIcon whitespace-nowrap">
                  Model Name
                </th>
                <th className="h-[60px] px-4 py-3 text-left font-bold border-b border-disabledIcon whitespace-nowrap">
                  Model Year
                </th>
                <th className="h-[60px] px-4 py-3 text-left font-bold border-b border-disabledIcon whitespace-nowrap">
                  ZEV Class
                </th>
                <th className="h-[60px] px-4 py-3 text-left font-bold border-b border-disabledIcon whitespace-nowrap">
                  ZEV Type
                </th>
                <th className="h-[60px] px-4 py-3 text-left font-bold border-b border-disabledIcon whitespace-nowrap">
                  Range
                </th>
                <th className="h-[60px] px-4 py-3 text-left font-bold border-b border-disabledIcon whitespace-nowrap">
                  Legacy Number of Units per Vehicle
                </th>
                <th className="h-[60px] px-4 py-3 text-left font-bold border-b border-disabledIcon whitespace-nowrap">
                  Number of Units per Vehicle
                </th>
                <th className="h-[60px] px-4 py-3 text-left font-bold border-b border-disabledIcon whitespace-nowrap">
                  Count
                </th>
              </tr>
            </thead>
            <tbody>
              {vinsStatRecords.map((record) => (
                <tr
                  key={crypto.randomUUID()}
                  className="odd:bg-lightGrey even:bg-white"
                >
                  <td className="px-4 py-3 border-b border-disabledIcon whitespace-nowrap">
                    {record.make}
                  </td>
                  <td className="px-4 py-3 border-b border-disabledIcon whitespace-nowrap">
                    {record.modelName}
                  </td>
                  <td className="px-4 py-3 border-b border-disabledIcon whitespace-nowrap">
                    {record.modelYear}
                  </td>
                  <td className="px-4 py-3 border-b border-disabledIcon whitespace-nowrap">
                    {record.zevClass}
                  </td>
                  <td className="px-4 py-3 border-b border-disabledIcon whitespace-nowrap">
                    {record.zevType}
                  </td>
                  <td className="px-4 py-3 border-b border-disabledIcon whitespace-nowrap">
                    {record.range}
                  </td>
                  <td className="px-4 py-3 border-b border-disabledIcon whitespace-nowrap">
                    {record.legacyNumberOfUnits}
                  </td>
                  <td className="px-4 py-3 border-b border-disabledIcon whitespace-nowrap">
                    {record.numberOfUnits}
                  </td>
                  <td className="px-4 py-3 border-b border-disabledIcon whitespace-nowrap">
                    {record.count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex flex-col border-t border-l border-r border-disabledIcon rounded-t">
        <div className="flex flex-col px-5 py-4 bg-disabledSurface font-bold">
          {type === "claimed" && "Credits Claimed"}
          {type === "issued" && "Credits Issued"}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="h-[60px] px-4 py-3 text-left font-bold border-b border-disabledIcon whitespace-nowrap">
                  ZEV Class
                </th>
                <th className="h-[60px] px-4 py-3 text-left font-bold border-b border-disabledIcon whitespace-nowrap">
                  Model Year
                </th>
                <th className="h-[60px] px-4 py-3 text-left font-bold border-b border-disabledIcon whitespace-nowrap">
                  Number of Units
                </th>
              </tr>
            </thead>
            <tbody>
              {creditsStatRecords.map((record) => {
                return (
                  <tr
                    key={crypto.randomUUID()}
                    className="odd:bg-lightGrey even:bg-white"
                  >
                    <td className="px-4 py-3 border-b border-disabledIcon whitespace-nowrap">
                      {record.zevClass}
                    </td>
                    <td className="px-4 py-3 border-b border-disabledIcon whitespace-nowrap">
                      {record.modelYear}
                    </td>
                    <td className="px-4 py-3 border-b border-disabledIcon whitespace-nowrap">
                      {record.credits}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
