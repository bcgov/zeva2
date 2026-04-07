import { getPageParams, pageStringParams } from "@/app/lib/utils/nextPage";
import { getUserInfo } from "@/auth";
import { AgreementList } from "./AgreementList";
import { Button } from "@/app/lib/components";
import { Routes } from "@/app/lib/constants";
import { Role } from "@/prisma/generated/enums";
import Link from "next/link";

export const ListPage = async (props: { searchParams?: pageStringParams }) => {
  const { page, pageSize, filters, sorts } = getPageParams(
    props.searchParams,
    1,
    10,
  );
  const { userIsGov, userRoles } = await getUserInfo();
  const canCreateNewAgreement =
    userIsGov && userRoles.includes(Role.ZEVA_IDIR_USER);

  return (
    <AgreementList
      page={page}
      pageSize={pageSize}
      filters={filters}
      sorts={sorts}
      userIsGov={userIsGov}
      headerContent={
        canCreateNewAgreement ? (
          <Link href={`${Routes.CreditAgreements}/new`}>
            <Button variant="primary">Create a New Agreement</Button>
          </Link>
        ) : undefined
      }
    />
  );
};
