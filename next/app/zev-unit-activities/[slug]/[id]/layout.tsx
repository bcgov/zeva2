import { ActivityDetailNav } from "@/app/zev-unit-activities/lib/components/ActivityDetailNav";
import { getCreditApplication } from "@/app/zev-unit-activities/lib/credit-applications/data";
import { getUserInfo } from "@/auth";
import { CreditApplicationTabs } from "../../lib/credit-applications/components/CreditApplicationTabs";

const Layout = async (props: {
  children: React.ReactNode;
  params: Promise<{ slug: string; id: string }>;
}) => {
  const { slug, id } = await props.params;
  const { userIsGov, userRoles } = await getUserInfo();
  const idInt = Number.parseInt(id, 10);
  let secondaryNavbar;
  if (slug === "credit-applications" && userIsGov) {
    const creditApplication = await getCreditApplication(idInt);
    if (creditApplication) {
      secondaryNavbar = (
        <CreditApplicationTabs
          creditApplicationId={id}
          creditApplicationStatus={creditApplication.status}
          validatedBefore={!!creditApplication.lastValidatedTimestamp}
          userRoles={userRoles}
        />
      );
    }
  }
  return (
    <>
      <ActivityDetailNav
        slug={slug}
        id={id}
        secondaryNavbar={secondaryNavbar}
      />
      {props.children}
    </>
  );
};

export default Layout;
