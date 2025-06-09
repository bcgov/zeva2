import { getData } from "../data";
import { serializeCredits, sumCredits } from "../utils";
import { ApplicationCredits } from "./ApplicationCredits";
import { DirectorActions } from "./DirectorActions";
import { CreditApplicationStatus } from "@/prisma/generated/client";
import { redirect, RedirectType } from "next/navigation";
import { Routes } from "@/app/lib/constants";

export const DirectorView = async (props: {
  id: number;
  status: CreditApplicationStatus;
}) => {
  const data = await getData(props.id);
  const summedCredits = sumCredits(data.credits);
  const serializedCredits = serializeCredits(summedCredits);

  const goToValidated = async () => {
    "use server";
    redirect(
      `${Routes.CreditApplication}/${props.id}/validated?readOnly=Y`,
      RedirectType.push,
    );
  };

  return (
    <>
      <ApplicationCredits credits={summedCredits} />
      <DirectorActions
        id={props.id}
        status={props.status}
        credits={serializedCredits}
        goToValidatedAction={goToValidated}
      />
    </>
  );
};
