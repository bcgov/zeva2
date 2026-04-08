import { ApplicationCreateOrEdit } from "./ApplicationCreateOrEdit";

export const EditPage = async (props: { id: string }) => {
  const creditApplicationId = Number.parseInt(props.id, 10);
  return <ApplicationCreateOrEdit creditApplicationId={creditApplicationId} />;
};
