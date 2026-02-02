import { ContentCard } from "@/app/lib/components";
import { getUserInfo } from "@/auth";
import { LoadingSkeleton } from "@/app/lib/components/skeletons";
import { JSX, Suspense } from "react";
import { VehicleHistories } from "../lib/components/VehicleHistories";
import { VehicleDetails } from "../lib/components/VehicleDetails";
import { getVehicle } from "../lib/data";
import { Role } from "@/prisma/generated/client";
import { getAttachmentDownloadUrls } from "../lib/actions";
import { AttachmentsDownload } from "@/app/lib/components/AttachmentsDownload";
import { SupplierActions } from "../lib/components/SupplierActions";
import { AnalystActions } from "../lib/components/AnalystActions";

const Page = async (props: { params: Promise<{ id: string }> }) => {
  const { userIsGov, userRoles } = await getUserInfo();
  const args = await props.params;
  const id = parseInt(args.id);
  const vehicle = await getVehicle(id);
  if (!vehicle) {
    return null;
  }
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
  } else if (userIsGov && userRoles.includes(Role.ZEVA_IDIR_USER)) {
    actions = <AnalystActions vehicleId={id} status={status} />;
  }
  return (
    <div className="flex flex-col w-1/3">
      <ContentCard title="Vehicle History">
        <Suspense fallback={<LoadingSkeleton />}>
          <VehicleHistories id={id} />
        </Suspense>
      </ContentCard>
      <ContentCard title="Vehicle Details">
        <Suspense fallback={<LoadingSkeleton />}>
          <VehicleDetails vehicle={vehicle} />
        </Suspense>
      </ContentCard>
      {vehicle._count.VehicleAttachment > 0 && (
        <ContentCard title="Download Additional Documents">
          <AttachmentsDownload
            download={download}
            zipName={`zev-model-attachments-${id}`}
          />
        </ContentCard>
      )}
      {actions && <ContentCard title="Actions">{actions}</ContentCard>}
    </div>
  );
};

export default Page;
