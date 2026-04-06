import { getPageParams, pageStringParams } from "@/app/lib/utils/nextPage";
import { CreditApplicationList } from "./CreditApplicationList";
import { getUserInfo } from "@/auth";
import Link from "next/link";
import { Routes } from "@/app/lib/constants";
import { Button } from "@/app/lib/components";

export const ListPage = async (props: { searchParams?: pageStringParams }) => {
  const { userIsGov } = await getUserInfo();
  const { page, pageSize, filters, sorts } = getPageParams(props.searchParams, 1, 10);

  return (
      <CreditApplicationList
        page={page}
        pageSize={pageSize}
        filters={filters}
        sorts={sorts}
        headerContent={
          !userIsGov ? (
            <Link href={`${Routes.CreditApplication}/new`}>
              <Button variant="primary">Create a Credit Application</Button>
            </Link>
          ) : undefined
        }
      />
  );
};
