import { Suspense } from "react";
import { LoadingSkeleton } from "../lib/components/skeletons";
import { getPageParams, pageStringParams } from "../lib/utils/nextPage";
import { OrganizationList } from "./lib/components/OrganizationList";
import { Button } from "@/app/lib/components";
import { Routes } from "@/app/lib/constants";

const Page = async (props: { searchParams?: Promise<pageStringParams> }) => {
  const searchParams = await props.searchParams;
  const { page, pageSize, filters, sorts } = getPageParams(searchParams, 1, 10);

  return (
    <Suspense key={Date.now()} fallback={<LoadingSkeleton />}>
      <a href={`${Routes.VehicleSuppliers}/new`}>
        <Button className="ml-4 p-2">+ New Supplier</Button>
      </a>
      <OrganizationList
        page={page}
        pageSize={pageSize}
        filters={filters}
        sorts={sorts}
      />
    </Suspense>
  );
};

export default Page;
