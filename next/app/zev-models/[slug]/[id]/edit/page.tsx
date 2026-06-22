import { Suspense } from "react";
import { getVehicle } from "@/app/zev-models/lib/data";
import { getAttachmentDownloadUrls } from "@/app/zev-models/lib/actions";
import { AttachmentDownload } from "@/app/lib/constants/attachment";
import {
  VehicleForm,
  VehicleFormData,
} from "@/app/zev-models/lib/components/VehicleForm";
import { getVehicleClassCodeEnumsToStringsMap } from "@/app/lib/utils/enumMaps";
import { VehicleStatus } from "@/prisma/generated/enums";

const Page = async (props: {
  params: Promise<{ slug: string; id: string }>;
}) => {
  const args = await props.params;
  const vehicleId = Number.parseInt(args.id, 10);
  const vehicle = await getVehicle(vehicleId);
  if (
    !vehicle ||
    (vehicle.status !== VehicleStatus.DRAFT &&
      vehicle.status !== VehicleStatus.RETURNED_TO_SUPPLIER)
  ) {
    return null;
  }
  const attachments: AttachmentDownload[] = [];
  const attachmentsResp = await getAttachmentDownloadUrls(vehicleId);
  if (attachmentsResp.responseType === "data") {
    attachments.push(...attachmentsResp.data);
  }
  const classCodesMap = getVehicleClassCodeEnumsToStringsMap();
  const serializedVehicle: {
    id: number;
    attachments: AttachmentDownload[];
  } & VehicleFormData = {
    id: vehicle.id,
    attachments,
    modelYear: vehicle.modelYear,
    make: vehicle.make,
    modelName: vehicle.modelName,
    zevType: vehicle.zevType,
    range: vehicle.range.toString(),
    bodyType: classCodesMap[vehicle.vehicleClassCode],
    gvwr: vehicle.weight.toString(),
    us06: vehicle.us06RangeGte16.toString(),
  };
  return (
    <div className="p-4">
      <h1 className="mb-6 mt-4 text-2xl font-bold text-primaryText">
        Edit a Vehicle
      </h1>
      <Suspense>
        <VehicleForm vehicle={serializedVehicle} />
      </Suspense>
    </div>
  );
};

export default Page;
