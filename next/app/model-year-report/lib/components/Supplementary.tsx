import { ContentCard } from "@/app/lib/components";
import { LoadingSkeleton } from "@/app/lib/components/skeletons";
import { getUserInfo } from "@/auth";
import { JSX, Suspense } from "react";
import { SupplementaryGovernmentActions } from "./SupplementaryGovernmentActions";
import { SupplementarySupplierActions } from "./SupplementarySupplierActions";
import { SupplementaryReportHistory } from "./SupplementaryReportHistory";
import { SupplementaryReportDetails } from "./SupplementaryReportDetails";
import {
  ModelYear,
  SupplementaryReportStatus,
} from "@/prisma/generated/client";
import { SystemDetails } from "./SystemDetails";
import { getSupplementaryReportStatusEnumsToStringsMap } from "@/app/lib/utils/enumMaps";

// used for both legacy and non-legacy supplementaries
export const Supplementary = async (props: {
  suppId: number;
  orgName: string;
  modelYear: ModelYear;
  status: SupplementaryReportStatus;
  sequenceNumber: number;
  myrId?: number;
}) => {
  const { userIsGov } = await getUserInfo();
  let actionComponent: JSX.Element | null = null;
  if (userIsGov) {
    actionComponent = (
      <SupplementaryGovernmentActions
        suppId={props.suppId}
        status={props.status}
      />
    );
  } else {
    actionComponent = (
      <SupplementarySupplierActions
        suppId={props.suppId}
        status={props.status}
        myrId={props.myrId}
      />
    );
  }
  const statusMap = getSupplementaryReportStatusEnumsToStringsMap();
  return (
    <div className="flex flex-col w-1/3">
      <ContentCard title="Supplementary Report History">
        <Suspense fallback={<LoadingSkeleton />}>
          <SupplementaryReportHistory suppId={props.suppId} />
        </Suspense>
      </ContentCard>
      <ContentCard title="System Details">
        <SystemDetails
          userIsGov={userIsGov}
          orgName={props.orgName}
          modelYear={props.modelYear}
          status={statusMap[props.status] ?? ""}
          sequenceNumber={props.sequenceNumber}
        />
      </ContentCard>
      <ContentCard title="The Supplementary Report">
        <Suspense fallback={<LoadingSkeleton />}>
          <SupplementaryReportDetails suppId={props.suppId} />
        </Suspense>
      </ContentCard>
      <ContentCard title="Actions">
        <Suspense fallback={<LoadingSkeleton />}>{actionComponent}</Suspense>
      </ContentCard>
    </div>
  );
};
