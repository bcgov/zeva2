import { Suspense } from "react";
import { LoadingSkeleton } from "@/app/lib/components/skeletons";
import { getVehicle, getVehicleHistories } from "@/app/zev-models/lib/data";
import { VehicleAuditHistory } from "@/app/zev-models/lib/components/VehicleAuditHistory";
import { getUserInfo } from "@/auth";
import { getVehicleStatusEnumsToStringsMap } from "@/app/lib/utils/enumMaps";
import { processAuditHistories } from "@/app/lib/utils/auditHistory";

const AuditHistoryContent = async ({ id }: { id: number }) => {
  const vehicle = await getVehicle(id);
  const histories = await getVehicleHistories(id);
  const { userIsGov } = await getUserInfo();
  
  if (!vehicle) {
    return <div>Vehicle not found</div>;
  }

  const statusMap = getVehicleStatusEnumsToStringsMap();

  const { entries, summary, statusOptions, roleOptions } = processAuditHistories({
    histories,
    userIsGov,
    statusMap,
  });

  return (
    <VehicleAuditHistory
      vehicleId={id}
      modelName={vehicle.modelName || String(id)}
      summary={summary}
      entries={entries}
      statusOptions={statusOptions}
      roleOptions={roleOptions}
    />
  );
};

const Page = async (props: {
  params: Promise<{ slug: string; id: string }>;
}) => {
  const args = await props.params;
  const id = Number.parseInt(args.id);

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <AuditHistoryContent id={id} />
    </Suspense>
  );
};

export default Page;
