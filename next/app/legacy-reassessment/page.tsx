import { Suspense } from "react";
import { LoadingSkeleton } from "../lib/components/skeletons";
import { getPageParams, pageStringParams } from "../lib/utils/nextPage";
import { getUserInfo } from "@/auth";
import Link from "next/link";
import { Button } from "../lib/components";
import { Routes } from "../lib/constants";
import { Role } from "@/prisma/generated/client";
import { LegacyReassessmentsList } from "../model-year-report/lib/components/LegacyReassessmentsLists";

// todo: since there should be a minimal number of legacy reassessments over time, we will
// transition to using the "client-side" table when it becomes available.
const Page = async (props: { searchParams?: Promise<pageStringParams> }) => {
  const { userIsGov, userRoles } = await getUserInfo();
  const searchParams = await props.searchParams;
  const { page, pageSize } = getPageParams(searchParams, 1, 10);

  let canSubmitReassessment = false;
  if (userIsGov && userRoles.includes(Role.ZEVA_IDIR_USER)) {
    canSubmitReassessment = true;
  }

  return (
    <Suspense key={Date.now()} fallback={<LoadingSkeleton />}>
      {canSubmitReassessment && (
        <Link href={`${Routes.LegacyReassessments}/new`}>
          <Button>Submit a Legacy Reassessment</Button>
        </Link>
      )}
      <LegacyReassessmentsList page={page} pageSize={pageSize} />
    </Suspense>
  );
};

export default Page;
