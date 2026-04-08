import { getUserInfo } from "@/auth";
import Link from "next/link";
import { Button } from "@/app/lib/components";
import { Routes } from "@/app/lib/constants";
import { Role } from "@/prisma/generated/enums";
import { LegacyReassessmentsList } from "./LegacyReassessmentsLists";

export const ListPage = async () => {
  const { userIsGov, userRoles } = await getUserInfo();
  let canSubmitReassessment = false;
  if (userIsGov && userRoles.includes(Role.ZEVA_IDIR_USER)) {
    canSubmitReassessment = true;
  }
  return (
    <LegacyReassessmentsList
      headerContent={
        canSubmitReassessment ? (
          <Link href={`${Routes.LegacyReassessments}/new`}>
            <Button>Create a Legacy Reassessment</Button>
          </Link>
        ) : undefined
      }
    />
  );
};
