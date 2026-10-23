import { getUserInfo } from "@/auth";
import { Breadcrumbs } from "@/app/lib/components";
import { AllRecordsTabsGov } from "../components/AllRecordsTabsGov";
import { AllRecordsTableGov } from "../components/AllRecordsTableGov";
import { getDateRangeOptions } from "../lib/utilsServer";
import { Routes } from "@/app/lib/constants";
import { isAllRecordTypeGov } from "../lib/utils";
import {
  getAllCaRecordsGov,
  getAllCreditAgreementRecordsGov,
  getAllCreditTransferRecordsGov,
  getAllMyrRecordsGov,
  getAllPenaltyCreditRecordsGov,
  getAllZevModelRecordsGov,
} from "../lib/services";
import { allRecordsViewParam, govViewsData } from "../lib/constants";
import { Role } from "@/prisma/generated/enums";

const Page = async (props: {
  searchParams: Promise<{ [allRecordsViewParam]: string }>;
}) => {
  const { userIsGov, userRoles } = await getUserInfo();
  if (!userIsGov) {
    return null;
  }
  const searchParams = await props.searchParams;
  let view = searchParams[allRecordsViewParam];
  if (!isAllRecordTypeGov(view)) {
    return null;
  }

  const viewData = govViewsData[view];
  const collection = await Promise.all([
    getAllCaRecordsGov(userRoles, view),
    getAllZevModelRecordsGov(userRoles, view),
    getAllCreditTransferRecordsGov(userRoles, view),
    getAllCreditAgreementRecordsGov(userRoles, view),
    getAllPenaltyCreditRecordsGov(userRoles, view),
    getAllMyrRecordsGov(userRoles, view),
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
    <div className="flex flex-col gap-6">
      <Breadcrumbs
        items={[
          { label: "Home", href: Routes.Home },
          { label: viewData.title },
        ]}
      />
      <AllRecordsTabsGov isDirector={userRoles.includes(Role.DIRECTOR)} />
      <div className="flex flex-col gap-5 border border-dividerMedium rounded">
        <div className="flex flex-col gap-2 bg-disabledSurface px-5 py-4">
          <span className="text-xl font-bold">{viewData.title}</span>
          <span className="text-sm">{viewData.description}</span>
        </div>
        <div className="px-5 pb-5">
          <AllRecordsTableGov
            records={records}
            dateRangeOptions={dateRangeOptions}
          />
        </div>
      </div>
    </div>
  );
};

export default Page;
