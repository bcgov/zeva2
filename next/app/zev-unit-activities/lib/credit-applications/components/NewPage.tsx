import { Breadcrumbs } from "@/app/lib/components";
import { Routes } from "@/app/lib/constants";
import { ApplicationCreateOrEdit } from "./ApplicationCreateOrEdit";

export const NewPage = async () => {
  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Credit Applications", href: Routes.CreditApplications },
          { label: "New Credit Application" },
        ]}
      />
      <ApplicationCreateOrEdit />
    </>
  );
};
