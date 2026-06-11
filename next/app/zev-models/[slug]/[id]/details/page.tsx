import { StatusBanner } from "@/app/lib/components";
import { getUserInfo } from "@/auth";
import { JSX, ReactNode } from "react";
import { getVehicle, getVehicleHistories } from "@/app/zev-models/lib/data";
import { Role, VehicleStatus } from "@/prisma/generated/enums";
import { getAttachmentDownloadUrls } from "@/app/zev-models/lib/actions";
import { SupplierActions } from "@/app/zev-models/lib/components/SupplierActions";
import { AnalystActions } from "@/app/zev-models/lib/components/AnalystActions";
import {
  getModelYearEnumsToStringsMap,
  getVehicleClassCodeEnumsToStringsMap,
  getVehicleClassEnumsToStringsMap,
  getVehicleStatusEnumsToStringsMap,
  getZevClassEnumsToStringsMap,
} from "@/app/lib/utils/enumMaps";
import { VehicleDetailsPrintButton } from "@/app/zev-models/lib/components/VehicleDetailsPrintButton";
import { VehicleDetailsAttachments } from "@/app/zev-models/lib/components/VehicleDetailsAttachments";
import { VehicleDetailsBackButton } from "@/app/zev-models/lib/components/VehicleDetailsBackButton";
import { AnalystDetailsPage } from "@/app/zev-models/lib/components/AnalystDetailsPage";

const DetailSection = (props: {
  title: string;
  rows: { label: string; value: string | number }[];
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

const PageSection = (props: {
  title: string;
  children: ReactNode;
}) => {
  return (
    <section className="overflow-hidden rounded border border-dividerMedium/10 bg-white shadow-level-1">
      <h2 className="bg-[#eeeceb] px-5 py-4 text-lg font-bold text-black">
        {props.title}
      </h2>
      <div className="p-5">{props.children}</div>
    </section>
  );
};

const getStatusMessage = (status: string) => {
  if (status === "DRAFT") {
    return "This model meets all verification criteria. Credits may now be issued for this model.";
  }
  if (status === "SUBMITTED") {
    return "This model has been submitted and is awaiting review.";
  }
  if (status === "VALIDATED") {
    return "This model has been validated. Credits may now be issued for this model.";
  }
  if (status === "RETURNED_TO_SUPPLIER") {
    return "This model has been returned to the supplier for updates.";
  }
  return "Review the model details below.";
};

const getStatusBannerTitle = (status: VehicleStatus, statusLabel: string) => {
  if (status === VehicleStatus.RETURNED_TO_SUPPLIER) {
    return "STATUS - Returned.";
  }

  return `STATUS - ${statusLabel}`;
};

const formatCommentDate = (date: Date) => {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Vancouver",
    timeZoneName: "short",
  })
    .format(date)
    .replace(",", "");
};

const Page = async (props: {
  params: Promise<{ slug: string; id: string }>;
}) => {
  const { userIsGov, userRoles } = await getUserInfo();
  const args = await props.params;
  const id = Number.parseInt(args.id);

  if (userIsGov && userRoles.includes(Role.ZEVA_IDIR_USER)) {
    return (
      <Suspense fallback={<LoadingSkeleton />}>
        <AnalystDetailsPage vehicleId={id} />
      </Suspense>
    );
  }

  const vehicle = await getVehicle(id);

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

  const histories = await getVehicleHistories(id);

  const download = async () => {
    "use server";
    return getAttachmentDownloadUrls(id);
  };

  const status = vehicle.status;
  let actions: JSX.Element | null = null;
  if (!userIsGov) {
    actions = (
      <SupplierActions
        vehicleId={id}
        status={status}
        isActive={vehicle.isActive}
        userRoles={userRoles}
      />
    );
  }

  const vehicleClassesMap = getVehicleClassEnumsToStringsMap();
  const zevClassesMap = getZevClassEnumsToStringsMap();
  const modelYearsMap = getModelYearEnumsToStringsMap();
  const statusMap = getVehicleStatusEnumsToStringsMap();
  const classCodesMap = getVehicleClassCodeEnumsToStringsMap();
  const latestComment = histories
    .filter((history) => history.comment)
    .slice()
    .reverse()[0];
  const latestReturnComment = histories
    .filter(
      (history) =>
        history.userAction === VehicleStatus.RETURNED_TO_SUPPLIER &&
        history.comment &&
        history.user.organization.isGovernment,
    )
    .slice()
    .reverse()[0];

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold text-primaryText">
        Create a Vehicle
      </h1>

      <section className="overflow-hidden border border-dividerMedium bg-white">
        <div className="flex items-center justify-between bg-[#eeeceb] px-5 py-5">
          <h2 className="text-2xl font-bold text-black">Model {vehicle.id}</h2>
          <VehicleDetailsPrintButton />
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
            title={getStatusBannerTitle(
              vehicle.status,
              statusMap[vehicle.status],
            )}
            primaryText={
              vehicle.status === VehicleStatus.RETURNED_TO_SUPPLIER
                ? ""
                : getStatusMessage(vehicle.status)
            }
            secondaryText={
              vehicle.status === VehicleStatus.RETURNED_TO_SUPPLIER &&
              latestReturnComment?.comment ? (
                <span>
                  <strong>Official Comment from Government of B.C.</strong>{" "}
                  "{latestReturnComment.comment}"
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
        <VehicleDetailsAttachments
          attachments={vehicle.VehicleAttachment}
          download={download}
          zipName={`zev-model-attachments-${id}`}
        />
      </PageSection>

      <PageSection title="Comment (optional)">
        {latestComment ? (
          <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-[12rem_1fr]">
            <span className="text-secondaryText">
              {formatCommentDate(latestComment.timestamp)}
            </span>
            <span className="text-primaryText">"{latestComment.comment}"</span>
          </div>
        ) : (
          <p className="text-sm text-secondaryText">No comments</p>
        )}
      </PageSection>

      <div className="flex flex-col gap-4 bg-gray-100 p-5 md:flex-row md:items-center md:justify-between">
        <VehicleDetailsBackButton />
        {actions && (
          <div className="flex flex-wrap items-center gap-3">{actions}</div>
        )}
      </div>
    </div>
  );
};

export default Page;
