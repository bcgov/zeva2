import { getUserInfo } from "@/auth";
import Link from "next/link";
import { Routes } from "@/app/lib/constants";
import { Button } from "@/app/lib/components";
import { CreditTransferList } from "./CreditTransferList";

export const ListPage = async () => {
  const { userIsGov } = await getUserInfo();
  return (
      <CreditTransferList
        headerContent={
          !userIsGov ? (
            <Link href={`${Routes.CreditTransfers}/new`}>
              <Button variant="primary">Create a Credit Transfer</Button>
            </Link>
          ) : undefined
        }
      />
  );
};
