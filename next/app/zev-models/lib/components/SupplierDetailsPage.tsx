import { Role, VehicleStatus } from "@/prisma/generated/enums";
import { SupplierActions } from "./SupplierActions";
import { getVehicle, getVehicleHistories } from "../data";
import { ReactNode } from "react";
import { StatusBanner } from "@/app/lib/components";
import { getAttachmentDownloadUrls } from "../actions";
import { PrintDownloadButton } from "@/app/lib/components/PrintDownloadButton";
import { Attachments } from "@/app/lib/components/Attachments";
import {
  getModelYearEnumsToStringsMap,
  getVehicleClassCodeEnumsToStringsMap,
  getVehicleClassEnumsToStringsMap,
  getVehicleStatusEnumsToStringsMap,
  getZevClassEnumsToStringsMap,
} from "@/app/lib/utils/enumMaps";
import { getIsoYmdString, getTimeWithTz } from "@/app/lib/utils/date";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload } from "@fortawesome/free-solid-svg-icons";

const DetailSection = (props: {
  title: string;
  rows: { label: string; value?: string | number }[];
}) => {
  return (
    <section className="overflow-hidden rounded border border-dividerMedium/10 bg-white">
      <h3 className="bg-[#f3f2f1] px-5 py-4 text-lg font-bold text-black">
        {props.title}
      </h3>
      <dl className="px-5 py-3">
        {props.rows.map((row) => (
          <div
            key={row.label}
            className="grid grid-cols-1 border-b border-dividerMedium/20 py-3 text-sm last:border-b-0 md:grid-cols-[13rem_1fr]"
          >
            <dt className="text-secondaryText">{row.label}</dt>
            <dd className="text-primaryText">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
};

const PageSection = (props: { title: string; children: ReactNode }) => {
  return (
    <section className="overflow-hidden rounded border border-dividerMedium/10 bg-white shadow-level-1">
      <h2 className="bg-disabledBG px-5 py-4 text-lg font-bold text-black">
        {props.title}
      </h2>
      <div className="p-5">{props.children}</div>
    </section>
  );
};

const getStatusMessage = (status: VehicleStatus) => {
  if (status === VehicleStatus.SUBMITTED) {
    return "This model has been submitted and is awaiting review.";
  }
  if (status === VehicleStatus.VALIDATED) {
    return "This model has been validated. Credits may now be issued for this model.";
  }
  if (status === VehicleStatus.RETURNED_TO_SUPPLIER) {
    return "This model has been returned to the supplier for updates.";
  }
  return "Review the model details below.";
};

const getStatusBannerTitle = (status: VehicleStatus) => {
  const statusMap = getVehicleStatusEnumsToStringsMap();
  if (status === VehicleStatus.RETURNED_TO_SUPPLIER) {
    return "STATUS - Returned.";
  }
  return `STATUS - ${statusMap[status]}`;
};

export const SupplierDetailsPage = async (props: {
  vehicleId: number;
  userRoles: Role[];
}) => {
  const vehicle = await getVehicle(props.vehicleId);
  if (!vehicle) {
    return (
      <div className="p-4">
        <StatusBanner
          title="Error"
          primaryText="Vehicle not found or unavailable."
        />
      </div>
    );
  }

  const histories = await getVehicleHistories(props.vehicleId);

  const download = async () => {
    "use server";
    return getAttachmentDownloadUrls(props.vehicleId);
  };

  const status = vehicle.status;
  const vehicleClassesMap = getVehicleClassEnumsToStringsMap();
  const zevClassesMap = getZevClassEnumsToStringsMap();
  const modelYearsMap = getModelYearEnumsToStringsMap();
  const classCodesMap = getVehicleClassCodeEnumsToStringsMap();
  const latestSubmitHistoryEntry = histories
    .filter((history) => history.userAction === VehicleStatus.SUBMITTED)
    .at(-1);
  const latestReturnComment = histories
    .filter(
      (history) =>
        history.userAction === VehicleStatus.RETURNED_TO_SUPPLIER &&
        history.comment,
    )
    .at(-1);

  return (
    <div className="space-y-6 p-4">
      <section className="overflow-hidden border border-dividerMedium bg-white">
        <div className="flex items-center justify-between bg-[#eeeceb] px-5 py-5">
          <h2 className="text-2xl font-bold text-black">Model {vehicle.id}</h2>
          <PrintDownloadButton icon={<FontAwesomeIcon icon={faDownload} />}>
            Print/Download Page
          </PrintDownloadButton>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 border-b border-dividerMedium px-5 py-4 text-base">
          <span>
            ID: <strong>{vehicle.id}</strong>
          </span>
          {vehicle.legacyId && (
            <span>
              Legacy ID: <strong>{vehicle.legacyId}</strong>
            </span>
          )}
        </div>
        <div className="space-y-5 p-5">
          <StatusBanner
            title={getStatusBannerTitle(vehicle.status)}
            primaryText={
              vehicle.status === VehicleStatus.RETURNED_TO_SUPPLIER
                ? ""
                : getStatusMessage(vehicle.status)
            }
            secondaryText={
              vehicle.status === VehicleStatus.RETURNED_TO_SUPPLIER &&
              latestReturnComment?.comment ? (
                <span>
                  <strong>Official Comment from Government of B.C.</strong> "
                  {latestReturnComment.comment}"
                </span>
              ) : undefined
            }
          />
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <DetailSection
              title="Vehicle Details"
              rows={[
                { label: "Make:", value: vehicle.make },
                { label: "Model Name:", value: vehicle.modelName },
                {
                  label: "Model Year:",
                  value: modelYearsMap[vehicle.modelYear],
                },
                {
                  label: "Body Type:",
                  value: classCodesMap[vehicle.vehicleClassCode],
                },
                { label: "Weight:", value: `${vehicle.weight} kg` },
                {
                  label: "Electric EPA Range (km):",
                  value: vehicle.range,
                },
              ]}
            />
            <DetailSection
              title="Compliance & Credit Information"
              rows={[
                { label: "ZEV Type:", value: vehicle.zevType },
                { label: "ZEV Class:", value: zevClassesMap[vehicle.zevClass] },
                {
                  label: "Vehicle class:",
                  value: vehicleClassesMap[vehicle.vehicleClass],
                },
                {
                  label: "US06 Range >= 16 km:",
                  value: vehicle.us06RangeGte16 ? "Yes" : "NO or N/A",
                },
                {
                  label: "Credit Entitlement:",
                  value: vehicle.numberOfUnits.toString(),
                },
              ]}
            />
          </div>
        </div>
      </section>

      <PageSection title="Supporting Documents (optional)">
        <Attachments
          attachments={vehicle.VehicleAttachment}
          download={download}
          zipName={`zev-model-attachments-${props.vehicleId}`}
        />
      </PageSection>

      {status !== VehicleStatus.DRAFT &&
        status !== VehicleStatus.VALIDATED &&
        latestSubmitHistoryEntry &&
        latestSubmitHistoryEntry.comment && (
          <PageSection title="Latest Submission Comment">
            <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-[12rem_1fr]">
              <span className="text-secondaryText">
                {`${getIsoYmdString(latestSubmitHistoryEntry.timestamp)}, ${getTimeWithTz(latestSubmitHistoryEntry.timestamp)}`}
              </span>
              <span className="text-primaryText">
                "{latestSubmitHistoryEntry.comment}"
              </span>
            </div>
          </PageSection>
        )}

      <SupplierActions
        vehicleId={props.vehicleId}
        status={status}
        isActive={vehicle.isActive}
        userRoles={props.userRoles}
      />
    </div>
  );
};
