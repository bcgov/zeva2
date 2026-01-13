import { Suspense } from "react";
import { getVehicle } from "../../lib/data";
import { getAttachmentDownloadUrls } from "../../lib/actions";
import { AttachmentDownload } from "@/app/lib/services/attachments";
import { VehicleForm, VehicleFormData } from "../../lib/components/VehicleForm";

const Page = async (props: { params: Promise<{ id: string }> }) => {
  const args = await props.params;
  const vehicleId = Number.parseInt(args.id, 10);
  const vehicle = await getVehicle(vehicleId);
  if (!vehicle) {
    return null;
  }
  const attachments: AttachmentDownload[] = [];
  const attachmentsResp = await getAttachmentDownloadUrls(vehicleId);
  if (attachmentsResp.responseType === "data") {
    attachments.push(...attachmentsResp.data);
  }
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
    bodyType: vehicle.vehicleClassCode,
    gvwr: vehicle.weight.toString(),
    us06: vehicle.us06RangeGte16.toString(),
  };
  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Edit a Vehicle</h1>
      <div className="bg-white rounded-lg shadow-level-1 p-6">
        <Suspense>
          <VehicleForm vehicle={serializedVehicle} />
        </Suspense>
      </div>
    </div>
  );
};

export default Page;
