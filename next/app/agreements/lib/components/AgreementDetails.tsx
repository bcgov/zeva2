import { AgreementStatus, AgreementType } from "@/prisma/generated/client";
import { ZevUnitRecord } from "@/lib/utils/zevUnit";
import {
  getAgreementStatusEnumsToStringsMap,
  getAgreementTypeEnumsToStringsMap,
  getModelYearEnumsToStringsMap,
  getVehicleClassEnumsToStringsMap,
  getZevClassEnumsToStringsMap,
} from "@/app/lib/utils/enumMaps";

const mainDivClass = "grid grid-cols-[220px_1fr]";
const fieldLabelClass = "py-1 font-semibold text-primaryBlue";

export const AgreementDetails = (props: {
  id: number;
  supplier: string;
  type: AgreementType;
  status: AgreementStatus;
  date: string;
  content: Omit<ZevUnitRecord, "type">[];
}) => {
  const statusMap = getAgreementStatusEnumsToStringsMap();
  const typesMap = getAgreementTypeEnumsToStringsMap();
  const vehicleClassMap = getVehicleClassEnumsToStringsMap();
  const zevClassesMap = getZevClassEnumsToStringsMap();
  const modelYearsMap = getModelYearEnumsToStringsMap();
  return (
    <>
      <h2 className="text-xl font-semibold text-primaryBlue pb-4">
        {typesMap[props.type]} Agreement
      </h2>
      <div>
        <div className={mainDivClass}>
          <span className={fieldLabelClass}>ID:</span> {props.id}
        </div>
        <div className={mainDivClass}>
          <span className={fieldLabelClass}>Supplier:</span> {props.supplier}
        </div>
        <div className={mainDivClass}>
          <span className={fieldLabelClass}>Status:</span>{" "}
          {statusMap[props.status]}
        </div>
        <div className={mainDivClass}>
          <span className={fieldLabelClass}>Date:</span> {props.date}
        </div>
        <div className="mt-4">
          <p className={fieldLabelClass}>ZEV Units</p>
          <table>
            <thead>
              <tr>
                <th className="border border-gray-300">Vehicle Class</th>
                <th className="border border-gray-300">ZEV Class</th>
                <th className="border border-gray-300">Model Year</th>
                <th className="border border-gray-300">Number of Units</th>
              </tr>
            </thead>
            <tbody>
              {props.content.map((record, index) => (
                <tr key={index}>
                  <td className="border border-gray-300">
                    {vehicleClassMap[record.vehicleClass]}
                  </td>
                  <td className="border border-gray-300">
                    {zevClassesMap[record.zevClass]}
                  </td>
                  <td className="border border-gray-300">
                    {modelYearsMap[record.modelYear]}
                  </td>
                  <td className="border border-gray-300">
                    {record.numberOfUnits.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};
