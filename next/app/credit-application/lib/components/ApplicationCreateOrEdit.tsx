import { getUserInfo } from "@/auth";
import { CreditApplicationForm } from "./CreditApplicationForm";

export const ApplicationCreateOrEdit = async (props: {
  creditApplicationId?: number;
}) => {
  const { userIsGov } = await getUserInfo();
  if (userIsGov) {
    return null;
  }
  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">
        {props.creditApplicationId ? "Re-upload" : "Submit"} a Credit
        Application
      </h1>
      {props.creditApplicationId && (
        <h2>
          Upon successful save, the previously uploaded application and
          previously uploaded attachments will be dereferenced.
        </h2>
      )}
      <div className="bg-white rounded-lg shadow-level-1 p-6">
        <CreditApplicationForm
          creditApplicationId={props.creditApplicationId}
        />
      </div>
    </div>
  );
};
