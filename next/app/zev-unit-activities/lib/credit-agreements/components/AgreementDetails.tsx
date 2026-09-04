import { AgreementType } from "@/prisma/generated/enums";
import { ZevUnitRecord } from "@/lib/utils/zevUnit";
import {
  getAgreementTypeEnumsToStringsMap,
  getModelYearEnumsToStringsMap,
  getVehicleClassEnumsToStringsMap,
  getZevClassEnumsToStringsMap,
} from "@/app/lib/utils/enumMaps";

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <section className="overflow-hidden rounded border border-dividerMedium bg-white">
    <h2 className="bg-disabledSurface px-5 py-4 text-xl font-bold text-black">
      {title}
    </h2>
    <div className="p-5">{children}</div>
  </section>
);

export const AgreementDetails = (props: {
  supplier: string;
  type: AgreementType;
  date: string;
  content: Omit<ZevUnitRecord, "type">[];
}) => {
  const typesMap = getAgreementTypeEnumsToStringsMap();
  const vehicleClassMap = getVehicleClassEnumsToStringsMap();
  const zevClassesMap = getZevClassEnumsToStringsMap();
  const modelYearsMap = getModelYearEnumsToStringsMap();
  return (
    <div className="flex flex-col gap-4">
      <Section title="Transfer Details">
        <dl className="flex flex-wrap items-center gap-x-5 gap-y-2 text-lg">
          <div className="flex gap-2 border-r border-dividerMedium pr-5">
            <dt className="font-bold text-secondaryText">Supplier:</dt>
            <dd>{props.supplier}</dd>
          </div>
          <div className="flex gap-2 border-r border-dividerMedium pr-5">
            <dt className="font-bold text-secondaryText">Agreement Type:</dt>
            <dd>{typesMap[props.type]}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-bold text-secondaryText">Date:</dt>
            <dd>{props.date}</dd>
          </div>
        </dl>
      </Section>
      <Section title="ZEV Units">
        <div className="overflow-x-auto rounded border border-dividerMedium">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="h-[60px] border-b border-dividerMedium">
                <th className="px-4">Vehicle Class</th>
                <th className="px-4">ZEV Class</th>
                <th className="px-4">Model Year</th>
                <th className="px-4">Number of Units</th>
              </tr>
            </thead>
            <tbody>
              {props.content.map((record, index) => (
                <tr
                  key={index}
                  className="h-[60px] border-b border-dividerMedium last:border-b-0"
                >
                  <td className="px-4">
                    {vehicleClassMap[record.vehicleClass]}
                  </td>
                  <td className="px-4">{zevClassesMap[record.zevClass]}</td>
                  <td className="px-4">{modelYearsMap[record.modelYear]}</td>
                  <td className="px-4">{record.numberOfUnits.toString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
};
