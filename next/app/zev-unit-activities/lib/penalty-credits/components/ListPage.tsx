import { getPageParams, pageStringParams } from "@/app/lib/utils/nextPage";
import { PenaltyCreditsList } from "./PenaltyCreditsList";
import Link from "next/link";
import { Routes } from "@/app/lib/constants";
import { Button } from "@/app/lib/components";
import { getUserInfo } from "@/auth";
import { Role } from "@/prisma/generated/enums";

export const ListPage = async (props: { searchParams?: pageStringParams }) => {
  const { page, pageSize, filters, sorts } = getPageParams(
    props.searchParams,
    1,
    10,
  );
  const { userIsGov, userRoles } = await getUserInfo();
  return (
    <PenaltyCreditsList
      page={page}
      pageSize={pageSize}
      filters={filters}
      sorts={sorts}
      headerContent={
        userIsGov && userRoles.includes(Role.ZEVA_IDIR_USER) ? (
          <Link href={`${Routes.PenaltyCredit}/new`}>
            <Button variant="primary">Create New Penalty Credit</Button>
          </Link>
        ) : undefined
      }
    />
  );
};
