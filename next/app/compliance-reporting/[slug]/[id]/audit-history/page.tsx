import { Suspense } from "react";
import { LoadingSkeleton } from "@/app/lib/components/skeletons";
import { getUserInfo } from "@/auth";
import { getMyrStatusEnumsToStringsMap } from "@/app/lib/utils/enumMaps";
import { processAuditHistories } from "@/app/lib/utils/auditHistory";
import { getMyrHistory } from "@/app/compliance-reporting/lib/model-year-reports/data";
import { AuditHistory } from "@/app/lib/components/audit-history";
import { SecondaryNavbar } from "@/app/lib/components/SecondaryNavbar";
import { Routes } from "@/app/lib/constants";

const Page = async (props: {
  params: Promise<{ slug: string; id: string }>;
  searchParams: Promise<{ modelYear: string; detailsType: string }>;
}) => {
  const args = await props.params;
  const searchParams = await props.searchParams;
  const id = Number.parseInt(args.id, 10);
  const detailsType = searchParams.detailsType;

  if (args.slug === "model-year-reports") {
    let route = "";
    if (detailsType === "new") {
      route = `${Routes.ModelYearReports}/new`;
    } else if (detailsType === "myr") {
      route = `${Routes.ModelYearReports}/${id}`;
    } else if (detailsType === "edit") {
      route = `${Routes.ModelYearReports}/${id}/edit`;
    } else if (detailsType === "newAssessment") {
      route = `${Routes.ModelYearReports}/${id}/assessment/new`;
    } else if (detailsType === "assessment") {
      route = `${Routes.ModelYearReports}/${id}/assessment`;
    } else if (detailsType === "editAssessment") {
      route = `${Routes.ModelYearReports}/${id}/assessment/edit`;
    }
    return (
      <>
        <SecondaryNavbar
          items={[
            { label: `Model Year Report ${searchParams.modelYear}`, route },
            {
              label: "Audit History",
              route: `${Routes.ModelYearReports}/${id}/audit-history`,
            },
          ]}
          activeIndex={1}
        />
        <Suspense fallback={<LoadingSkeleton />}>
          <MyrAuditHistoryContent id={id} modelYear={searchParams.modelYear} />
        </Suspense>
      </>
    );
  }
  return null;
};

// later: will probably have to amalgamate supplementary and reassessment histories here
const MyrAuditHistoryContent = async (props: {
  id: number;
  modelYear: string;
}) => {
  const { userIsGov } = await getUserInfo();
  const histories = await getMyrHistory(props.id);
  const statusMap = getMyrStatusEnumsToStringsMap();

  const { entries, summary, statusOptions, roleOptions } =
    processAuditHistories({
      histories,
      userIsGov,
      statusMap,
    });

  return (
    <AuditHistory
      title={`Audit History for Model Year Report ${props.modelYear}`}
      summary={summary}
      entries={entries}
      statusOptions={statusOptions}
      roleOptions={roleOptions}
      printable={true}
    />
  );
};

export default Page;
