import { getUserInfo } from "@/auth";
import { Breadcrumbs } from "@/app/lib/components";
import { Routes } from "@/app/lib/constants";
import { AllRecordsTabsSupplier } from "../components/AllRecordsTabsSupplier";
import { AllRecordsTableSupplier } from "../components/AllRecordsTableSupplier";
import { getDateRangeOptions } from "../lib/utilsServer";
import { isAllRecordTypeSupplier } from "../lib/utils";
import { getAllRecordsSupplier } from "../lib/services";
import { allRecordsViewParam, supplierViewsData } from "../lib/constants";

const Page = async (props: {
  searchParams: Promise<{ [allRecordsViewParam]: string }>;
}) => {
  const { userIsGov, userOrgId } = await getUserInfo();
  if (userIsGov || !userOrgId) {
    return null;
  }
  const view = (await props.searchParams)[allRecordsViewParam];
  if (!isAllRecordTypeSupplier(view)) {
    return null;
  }

  const viewData = supplierViewsData[view];
  const records = await getAllRecordsSupplier(userOrgId, view);
  records.sort((a, b) => {
    if (b.date > a.date) {
      return 1;
    }
    if (b.date < a.date) {
      return -1;
    }
    return 0;
  });
  const dateRangeOptions = getDateRangeOptions(
    records.filter((record) => record.date),
    3,
  );

  return (
    <div className="flex flex-col">
      <Breadcrumbs
        items={[
          { label: "Home", href: Routes.Home },
          { label: viewData.title },
        ]}
      />
      <AllRecordsTabsSupplier />
      <div className="flex flex-col gap-5 border border-dividerMedium rounded">
        <div className="flex flex-col gap-2 bg-disabledSurface px-5 py-4">
          <span className="text-xl font-bold">{viewData.title}</span>
          <span className="text-sm">{viewData.description}</span>
        </div>
        <div className="px-5 pb-5">
          <AllRecordsTableSupplier
            records={records}
            dateRangeOptions={dateRangeOptions}
          />
        </div>
      </div>
    </div>
  );
};

export default Page;
