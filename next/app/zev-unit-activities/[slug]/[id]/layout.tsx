import { ActivityDetailNav } from "@/app/zev-unit-activities/lib/components/ActivityDetailNav";
import { getCreditApplication } from "@/app/zev-unit-activities/lib/credit-applications/data";
import { getUserInfo } from "@/auth";

const Layout = async (props: {
  children: React.ReactNode;
  params: Promise<{ slug: string; id: string }>;
}) => {
  const { slug, id } = await props.params;
  const { userIsGov } = await getUserInfo();
  const creditApplication =
    slug === "credit-applications" && userIsGov
      ? await getCreditApplication(Number.parseInt(id, 10))
      : null;
  return (
    <>
      <ActivityDetailNav
        slug={slug}
        id={id}
        showCreditApplicationTabs={userIsGov}
        validatedBefore={Boolean(creditApplication?.lastValidatedTimestamp)}
      />
      {props.children}
    </>
  );
};

export default Layout;
