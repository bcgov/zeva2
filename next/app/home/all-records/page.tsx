import { getUserInfo } from "@/auth";
import {
  getAllCaRecords,
  getAllCreditAgreementRecords,
  getAllCreditTransferRecords,
  getAllMyrRecords,
  getAllPenaltyCreditRecords,
  getAllZevModelRecords,
  getGovCompletedRecords,
  getGovInProgressRecords,
  getGovRequiresActionRecords,
  getGovWithDirectorRecords,
} from "../lib/services";
import { Breadcrumbs } from "@/app/lib/components";
import { SecondaryNavbar } from "@/app/lib/components/SecondaryNavbar";
import { AllRecordsTabs } from "../components/AllRecordsTabs";
import { AllRecordsTable } from "../components/AllRecordsTable";
import { getDateRangeOptions } from "../lib/utilsServer";
import { Routes } from "@/app/lib/constants";
import {
  AllRecordsView,
  allRecordsViewParam,
  SerializedAllRecordsRecord,
} from "../lib/constants";

const viewCopy: Record<AllRecordsView, { title: string; description: string }> =
  {
    [AllRecordsView.RequiresYourAction]: {
      title: "Requires Your Action",
      description: "Records awaiting action from you.",
    },
    [AllRecordsView.InProgress]: {
      title: "In Progress",
      description: "Records currently in progress.",
    },
    [AllRecordsView.WithDirector]: {
      title: "With Director",
      description: "Records currently with a Director.",
    },
    [AllRecordsView.Completed]: {
      title: "Completed",
      description: "Records that have been completed.",
    },
  };

const Page = async (props: {
  searchParams?: Promise<{ [allRecordsViewParam]?: string }>;
}) => {
  const { userIsGov, userOrgId, userRoles } = await getUserInfo();
  const searchParams = await props.searchParams;
  const requestedView = searchParams?.[allRecordsViewParam];
  const view: AllRecordsView | undefined =
    userIsGov &&
    (Object.values(AllRecordsView) as string[]).includes(requestedView ?? "")
      ? (requestedView as AllRecordsView)
      : undefined;

  let records: SerializedAllRecordsRecord[];
  if (view === AllRecordsView.RequiresYourAction) {
    records = await getGovRequiresActionRecords(userRoles);
  } else if (view === AllRecordsView.InProgress) {
    records = await getGovInProgressRecords(userRoles);
  } else if (view === AllRecordsView.WithDirector) {
    records = await getGovWithDirectorRecords();
  } else if (view === AllRecordsView.Completed) {
    records = await getGovCompletedRecords();
  } else {
    const collection = await Promise.all([
      getAllCaRecords(userIsGov, userRoles, userIsGov ? undefined : userOrgId),
      getAllZevModelRecords(
        userIsGov,
        userRoles,
        userIsGov ? undefined : userOrgId,
      ),
      getAllCreditTransferRecords(
        userIsGov,
        userRoles,
        userIsGov ? undefined : userOrgId,
      ),
      getAllCreditAgreementRecords(
        userIsGov,
        userRoles,
        userIsGov ? undefined : userOrgId,
      ),
      getAllPenaltyCreditRecords(
        userIsGov,
        userRoles,
        userIsGov ? undefined : userOrgId,
      ),
      getAllMyrRecords(userIsGov, userRoles, userIsGov ? undefined : userOrgId),
    ]);
    records = collection.flat();
  }

  records.sort((a, b) => {
    if (b.date > a.date) {
      return 1;
    }
    if (b.date < a.date) {
      return -1;
    }
    return 0;
  });
  const dateRangeOptions = getDateRangeOptions(records, 3);
  const copy = view ? viewCopy[view] : undefined;

  return (
    <div className="flex flex-col">
      <Breadcrumbs
        items={[
          { label: "Home", href: Routes.Home },
          { label: copy?.title ?? "All Records" },
        ]}
      />
      {userIsGov ? (
        <AllRecordsTabs />
      ) : (
        <SecondaryNavbar
          items={[
            { label: "All Records", route: `${Routes.Home}/all-records` },
          ]}
        />
      )}
      <div className="flex flex-col gap-5 border border-dividerMedium rounded">
        <div className="flex flex-col gap-2 bg-disabledSurface px-5 py-4">
          <span className="text-xl font-bold">
            {copy?.title ?? "All Records"}
          </span>
          <span className="text-sm">
            {copy?.description ??
              "Browse and search all records available to your organization."}
          </span>
        </div>
        <div className="px-5 pb-5">
          <AllRecordsTable
            records={records}
            userIsGov={userIsGov}
            dateRangeOptions={dateRangeOptions}
          />
        </div>
      </div>
    </div>
  );
};

export default Page;
