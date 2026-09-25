import { getUserInfo } from "@/auth";
import {
  getAllCaRecords,
  getAllCreditAgreementRecords,
  getAllCreditTransferRecords,
  getAllMyrRecords,
  getAllPenaltyCreditRecords,
  getAllZevModelRecords,
} from "../lib/services";
import { Breadcrumbs } from "@/app/lib/components";
import { SecondaryNavbar } from "@/app/lib/components/SecondaryNavbar";
import { AllRecordsTable } from "../components/AllRecordsTable";
import { getDateRangeOptions } from "../lib/utilsServer";
import { Routes } from "@/app/lib/constants";

const Page = async () => {
  const { userIsGov, userOrgId, userRoles } = await getUserInfo();
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

  const records = collection.flat();
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

  return (
    <div className="flex flex-col">
      <Breadcrumbs
        items={[{ label: "Home", href: Routes.Home }, { label: "All Records" }]}
      />
      <SecondaryNavbar
        items={
          userIsGov
            ? [
                { label: "All Records", route: `${Routes.Home}/all-records` },
                {
                  label: "Activity Feed",
                  route: `${Routes.Home}/activity-feed`,
                },
              ]
            : [{ label: "All Records", route: `${Routes.Home}/all-records` }]
        }
      />
      <div className="flex flex-col gap-5 border border-dividerMedium rounded">
        <div className="flex flex-col gap-2 bg-disabledSurface px-5 py-4">
          <span className="text-xl font-bold">All Records</span>
          <span className="text-sm">
            Browse and search all records available to your organization.
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
