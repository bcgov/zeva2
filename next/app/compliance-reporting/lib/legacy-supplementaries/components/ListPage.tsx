import { getUserInfo } from "@/auth";
import Link from "next/link";
import { Button } from "@/app/lib/components";
import { Routes } from "@/app/lib/constants";
import { LegacySupplementariesList } from "./LegacySupplementariesList";

export const ListPage = async () => {
  const { userIsGov } = await getUserInfo();
  return (
    <LegacySupplementariesList
      headerContent={
        !userIsGov ? (
          <Link href={`${Routes.LegacySupplementary}/new`}>
            <Button>Create a Legacy Supplementary Report</Button>
          </Link>
        ) : undefined
      }
    />
  );
};
