import { getVehicle, getVehicleHistories } from "../data";
import { VehicleStatus } from "@/prisma/generated/enums";
import { StatusBanner } from "@/app/lib/components/StatusBanner";
import { AnalystActions } from "./AnalystActions";
import { BackButton } from "./BackButton";
import { Attachments } from "@/app/lib/components/Attachments";
import { getFormattedDateTime } from "@/app/lib/utils/date";
import { getAttachmentDownloadUrls } from "../actions";
import {
  getModelYearEnumsToStringsMap,
  getVehicleClassCodeEnumsToStringsMap,
  getVehicleClassEnumsToStringsMap,
  getZevClassEnumsToStringsMap,
} from "@/app/lib/utils/enumMaps";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload } from "@fortawesome/free-solid-svg-icons";
import { PrintDownloadButton } from "@/app/zev-unit-activities/lib/credit-applications/components/PrintDownloadButton";

export const AnalystDetailsPage = async ({
  vehicleId,
}: {
  vehicleId: number;
}) => {
  const vehicle = await getVehicle(vehicleId);
  if (!vehicle) return null;

  const histories = await getVehicleHistories(vehicleId);

  const vehicleClassesMap = getVehicleClassEnumsToStringsMap();
  const zevClassesMap = getZevClassEnumsToStringsMap();
  const modelYearsMap = getModelYearEnumsToStringsMap();
  const classCodesMap = getVehicleClassCodeEnumsToStringsMap();

  const download = async () => {
    "use server";
    return getAttachmentDownloadUrls(vehicleId);
  };

  const submissionHistory = histories.find(
    (h) => h.userAction === VehicleStatus.SUBMITTED,
  );
  const validationHistory = [...histories]
    .reverse()
    .find((h) => h.userAction === VehicleStatus.VALIDATED);

  const commentHistories = histories.filter(
    (h) => h.userAction === VehicleStatus.SUBMITTED && !!h.comment,
  );

  const isSubmitted = vehicle.status === VehicleStatus.SUBMITTED;
  const isValidated = vehicle.status === VehicleStatus.VALIDATED;

  const metaDateLabel = isSubmitted ? "Date of Submission" : "Validation Date";
  const metaDate = isSubmitted
    ? submissionHistory
      ? getFormattedDateTime(submissionHistory.timestamp)
      : null
    : validationHistory
      ? getFormattedDateTime(validationHistory.timestamp)
      : null;

  let statusBanner;
  if (isSubmitted) {
    statusBanner = (
      <StatusBanner
        title="STATUS - Submitted"
        primaryText="Pending confirmation."
      />
    );
  } else if (isValidated) {
    statusBanner = (
      <StatusBanner
        title="Validated"
        primaryText="This model meets all verification criteria. Credits may now be issued for this model."
      />
    );
  }

  return (
    <div className="bg-white">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">
          Model {vehicle.modelName}
        </h1>
        <PrintDownloadButton icon={<FontAwesomeIcon icon={faDownload} />}>
          Print/Download Page
        </PrintDownloadButton>
      </div>

      <div className="px-6 py-3 text-sm text-gray-700 border-b border-gray-200">
        <span className="font-semibold">ID:</span> {vehicle.id}
        {vehicle.legacyId != null && (
          <>
            {"  "}
            <span className="font-semibold">Legacy ID:</span> {vehicle.legacyId}
          </>
        )}
        {"  "}
        <span className="font-semibold">Supplier:</span>{" "}
        <strong>{vehicle.organization.name}</strong>
        {metaDate && (
          <>
            {"  "}
            <span className="font-semibold">{metaDateLabel}:</span>{" "}
            <strong>{metaDate}</strong>
          </>
        )}
      </div>

      {statusBanner && (
        <div className="px-6 pt-4 pb-2">{statusBanner}</div>
      )}

      <div className="px-6 pb-6 pt-4 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="border border-gray-300 rounded">
            <div className="p-4 bg-gray-100 border-b border-gray-300">
              <h2 className="text-sm font-bold text-gray-900">
                Vehicle Details
              </h2>
            </div>
            <table className="w-full text-sm text-gray-900">
              <tbody>
                <tr className="border-b border-gray-100">
                  <th scope="row" className="px-4 py-2 text-gray-500 font-normal text-left w-1/2">Make:</th>
                  <td className="px-4 py-2 font-medium">{vehicle.make}</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <th scope="row" className="px-4 py-2 text-gray-500 font-normal text-left">Model Name:</th>
                  <td className="px-4 py-2 font-medium">{vehicle.modelName}</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <th scope="row" className="px-4 py-2 text-gray-500 font-normal text-left">Model Year:</th>
                  <td className="px-4 py-2 font-medium">
                    {modelYearsMap[vehicle.modelYear]}
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <th scope="row" className="px-4 py-2 text-gray-500 font-normal text-left">Body Type:</th>
                  <td className="px-4 py-2 font-medium">
                    {classCodesMap[vehicle.vehicleClassCode]}
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <th scope="row" className="px-4 py-2 text-gray-500 font-normal text-left">Weight:</th>
                  <td className="px-4 py-2 font-medium">
                    {vehicle.weight} kg
                  </td>
                </tr>
                <tr>
                  <th scope="row" className="px-4 py-2 text-gray-500 font-normal text-left">
                    Electric EPA Range (km):
                  </th>
                  <td className="px-4 py-2 font-medium">{vehicle.range}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="border border-gray-300 rounded">
            <div className="p-4 bg-gray-100 border-b border-gray-300">
              <h2 className="text-sm font-bold text-gray-900">
                Compliance &amp; Credit Information
              </h2>
            </div>
            <table className="w-full text-sm text-gray-900">
              <tbody>
                <tr className="border-b border-gray-100">
                  <th scope="row" className="px-4 py-2 text-gray-500 font-normal text-left w-1/2">ZEV Type:</th>
                  <td className="px-4 py-2 font-medium">{vehicle.zevType}</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <th scope="row" className="px-4 py-2 text-gray-500 font-normal text-left">ZEV Class:</th>
                  <td className="px-4 py-2 font-medium">
                    {zevClassesMap[vehicle.zevClass]}
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <th scope="row" className="px-4 py-2 text-gray-500 font-normal text-left">Vehicle class:</th>
                  <td className="px-4 py-2 font-medium">
                    {vehicleClassesMap[vehicle.vehicleClass]}
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <th scope="row" className="px-4 py-2 text-gray-500 font-normal text-left">
                    US06 Range ≥ 16 km:
                  </th>
                  <td className="px-4 py-2 font-medium">
                    {vehicle.us06RangeGte16 ? "Yes" : "NO or N/A"}
                  </td>
                </tr>
                <tr>
                  <th scope="row" className="px-4 py-2 text-gray-500 font-normal text-left">
                    Credit Entitlement:
                  </th>
                  <td className="px-4 py-2 font-medium">
                    {vehicle.numberOfUnits.toString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="border border-gray-300 rounded">
          <div className="p-4 bg-gray-100 border-b border-gray-300">
            <h2 className="text-sm font-bold text-gray-900">
              Supporting Documents
            </h2>
          </div>
          <div className="p-4">
            <Attachments
              attachments={vehicle.VehicleAttachment}
              download={download}
              zipName={`zev-model-attachments-${vehicleId}`}
            />
          </div>
        </div>

        {isSubmitted && commentHistories.length > 0 && (
          <div className="border border-gray-300 rounded">
            <div className="p-4 bg-gray-100 border-b border-gray-300">
              <h2 className="text-sm font-bold text-gray-900">
                Comment (optional)
              </h2>
            </div>
            <div className="p-4 space-y-3">
              {commentHistories.map((h) => (
                <div key={h.id} className="flex gap-6 text-sm text-gray-900">
                  <span className="text-gray-500 shrink-0">
                    {getFormattedDateTime(h.timestamp)}
                  </span>
                  <span>&ldquo;{h.comment}&rdquo;</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {isSubmitted && (
          <AnalystActions vehicleId={vehicleId} status={vehicle.status} />
        )}

        {isValidated && (
          <div className="pt-2">
            <BackButton />
          </div>
        )}
      </div>
    </div>
  );
};
