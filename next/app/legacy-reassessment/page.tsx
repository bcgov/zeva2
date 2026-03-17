import { Suspense } from "react";
import { LoadingSkeleton } from "../lib/components/skeletons";
import { getUserInfo } from "@/auth";
import Link from "next/link";
import { Button } from "../lib/components";
import { Routes } from "../lib/constants";
import { Role } from "@/prisma/generated/enums";
import { LegacyReassessmentsList } from "./lib/components/LegacyReassessmentsLists";

const Page = async () => {
  const { userIsGov, userRoles } = await getUserInfo();
  let canSubmitReassessment = false;
  if (userIsGov && userRoles.includes(Role.ZEVA_IDIR_USER)) {
    canSubmitReassessment = true;
  }
  return (
    <Suspense key={Date.now()} fallback={<LoadingSkeleton />}>
      <LegacyReassessmentsList
        headerContent={
          canSubmitReassessment ? (
            <Link href={`${Routes.LegacyReassessments}/new`}>
              <Button>Create a Legacy Reassessment</Button>
            </Link>
          ) : undefined
        }
      />
    </Suspense>
  );
};

export default Page;
