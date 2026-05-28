import { SecondaryNavbar } from "@/app/lib/components/SecondaryNavbar";
import { Routes } from "@/app/lib/constants";

export const IndividualNavbar = (props: { creditApplicationId: string }) => {
  const items = [
    {
      label: `Credit Application ID ${props.creditApplicationId}`,
      route: `${Routes.CreditApplications}/${props.creditApplicationId}`,
    },
    {
      label: "Audit History",
      route: `${Routes.CreditApplications}/${props.creditApplicationId}/audit-history`,
    },
  ];

  return <SecondaryNavbar items={items} />;
};
