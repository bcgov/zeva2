import { ActivityDetailNav } from "@/app/zev-unit-activities/lib/components/ActivityDetailNav";
import { getUserInfo } from "@/auth";
import { CreditApplicationTabs } from "../../lib/credit-applications/components/CreditApplicationTabs";
import { getCreditApplicationGov } from "../../lib/credit-applications/services";
import { getMostRecentValidationData } from "../../lib/credit-applications/utilsServer";

const Layout = async (props: {
  children: React.ReactNode;
  params: Promise<{ slug: string; id: string }>;
}) => {
  const { slug, id } = await props.params;
  const { userIsGov, userRoles } = await getUserInfo();
  const idInt = Number.parseInt(id, 10);
  let secondaryNavbar;
  if (slug === "credit-applications" && userIsGov) {
    const creditApplication = await getCreditApplicationGov(idInt, userRoles);
    if (creditApplication) {
      const validationData = getMostRecentValidationData(
        creditApplication.CreditApplicationHistory,
      );
      secondaryNavbar = (
        <CreditApplicationTabs
          creditApplicationId={id}
          creditApplicationStatus={creditApplication.status}
          validatedBefore={!!validationData}
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
