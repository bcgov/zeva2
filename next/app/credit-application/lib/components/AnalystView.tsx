import { getData } from "../data";
import { AnalystActions } from "./AnalystActions";
import { sumCredits } from "../utils";
import { ApplicationCredits } from "./ApplicationCredits";
import { CreditApplicationStatus } from "@/prisma/generated/client";
import { validateCreditApplication } from "../actions";
import { redirect, RedirectType } from "next/navigation";
import { Routes } from "@/app/lib/constants";

export const AnalystView = async (props: {
  id: number;
  status: CreditApplicationStatus;
}) => {
  const data = await getData(props.id);
  const validatedBefore = data.numberOfRecords > 0;
  const summedCredits = sumCredits(data.credits);

  const validateWrapped = async () => {
    "use server";
    await validateCreditApplication(props.id);
    redirect(
      `${Routes.CreditApplication}/${props.id}/validated`,
      RedirectType.push,
    );
  };

  const goToValidated = async (readOnly: boolean) => {
    "use server";
    redirect(
      `${Routes.CreditApplication}/${props.id}/validated${readOnly ? "?readOnly=Y" : ""}`,
      RedirectType.push,
    );
  };

  return (
    <>
      <ApplicationCredits credits={summedCredits} />
      <AnalystActions
        id={props.id}
        status={props.status}
        validatedBefore={validatedBefore}
        validateAction={validateWrapped}
        goToValidatedAction={goToValidated}
      />
    </>
  );
};
