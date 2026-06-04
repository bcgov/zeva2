import { IndividualNavbar } from "@/app/zev-unit-activities/lib/credit-applications/components/IndividualNavbar";

const Layout = async (props: {
  children: React.ReactNode;
  params: Promise<{ slug: string; id: string }>;
}) => {
  const { slug, id } = await props.params;

  if (slug === "credit-applications") {
    return (
      <>
        <IndividualNavbar creditApplicationId={id} />
        {props.children}
      </>
    );
  }

  return <>{props.children}</>;
};

export default Layout;
