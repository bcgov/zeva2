import { ContentCard } from "@/app/lib/components";
import { getData } from "../data";
import { serializeCredits, sumCredits } from "../utils";
import { ApplicationCredits } from "./ApplicationCredits";
import { directorApprove } from "../actions";
import { DirectorActions } from "./DirectorActions";
import { CreditApplicationStatus } from "@/prisma/generated/client";

export const DirectorView = async (props: {
  id: number;
  status: CreditApplicationStatus;
}) => {
  const data = await getData(props.id);
  const summedCredits = sumCredits(data.credits);
  const serializedCredits = serializeCredits(summedCredits);

  const directorApproveWrapped = async () => {
    "use server";
    await directorApprove(props.id, serializedCredits);
  };

  return (
    <ContentCard title="Actions">
      <ApplicationCredits credits={summedCredits} />
      <DirectorActions
        status={props.status}
        approveAction={directorApproveWrapped}
      />
    </ContentCard>
  );
};
