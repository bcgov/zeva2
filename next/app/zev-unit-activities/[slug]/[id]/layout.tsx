import { IndividualNavbar } from "@/app/zev-unit-activities/lib/credit-applications/components/IndividualNavbar";
import { Breadcrumbs } from "@/app/lib/components";
import { Routes } from "@/app/lib/constants";

const Layout = async (props: {
  children: React.ReactNode;
  params: Promise<{ slug: string; id: string }>;
}) => {
  const { slug, id } = await props.params;

  if (slug === "credit-applications") {
    return (
      <>
        <Breadcrumbs
          items={[
            { label: "Credit Applications", href: Routes.CreditApplications },
            { label: `Credit Application ID ${id}` },
          ]}
        />
        <IndividualNavbar creditApplicationId={id} />
        {props.children}
      </>
    );
  }

  return <>{props.children}</>;
};

export default Layout;
