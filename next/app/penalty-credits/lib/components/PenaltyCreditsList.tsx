import { Routes } from "@/app/lib/constants";
import { getUserInfo } from "@/auth";
import { redirect } from "next/navigation";
import { getPenaltyCredits } from "../data";
import { PenaltyCreditsTable } from "./PenaltyCreditsTable";

export const PenaltyCreditsList = async (props: {
  page: number;
  pageSize: number;
  filters: Record<string, string>;
  sorts: Record<string, string>;
}) => {
  const { userIsGov } = await getUserInfo();
  if (!userIsGov) {
    return null;
  }
  const navigationAction = async (id: number) => {
    "use server";
    redirect(`${Routes.PenaltyCredit}/${id}`);
  };
  const [credits, totalNumberOfCredits] = await getPenaltyCredits(
    props.page,
    props.pageSize,
    props.filters,
    props.sorts,
  );

  return (
    <PenaltyCreditsTable
      credits={credits}
      totalNumberOfCredits={totalNumberOfCredits}
      navigationAction={navigationAction}
    />
  );
};
