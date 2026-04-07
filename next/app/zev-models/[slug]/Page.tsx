import { Suspense } from "react";
import { LoadingSkeleton } from "@/app/lib/components/skeletons";
import { getPageParams, pageStringParams } from "@/app/lib/utils/nextPage";
import { VehicleList } from "../lib/components/VehicleList";
import { getUserInfo } from "@/auth";
import Link from "next/link";
import { Button } from "@/app/lib/components";
import { Routes } from "@/app/lib/constants";

const Page = async (props: { params: Promise<{ slug: string }>, searchParams?: Promise<pageStringParams> }) => {
  const { userIsGov } = await getUserInfo();
  const args = await props.params;
  const slug = args.slug;
  const searchParams = await props.searchParams;
  const { page, pageSize, filters, sorts } = getPageParams(searchParams, 1, 10);

  if (slug === "active" || slug === "inactive") {
    return (
      <Suspense fallback={<LoadingSkeleton />}>
        <VehicleList
        type={slug}
        page={page}
        pageSize={pageSize}
        filters={filters}
        sorts={sorts}
        headerContent={
          !userIsGov ? (
            <Link href={Routes.NewZevModels}>
              <Button variant="primary">Create a Vehicle</Button>
            </Link>
          ) : undefined
        }
      />
      </Suspense>
  );
  }
  return null;
};

export default Page;
