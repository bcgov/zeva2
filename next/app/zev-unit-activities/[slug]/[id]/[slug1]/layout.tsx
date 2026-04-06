import { Navbar } from "@/app/zev-unit-activities/lib/credit-applications/components/Navbar";

const Layout = async (props: {
  children: React.ReactNode;
  params: Promise<{ slug: string; id: string; slug1: string }>;
}) => {
  const { slug, id, slug1 } = await props.params;
  if (slug === "credit-applications" && (slug1 === "validated" || slug1 === "model-name-mismatches")) {
    return (
      <>
        <Navbar creditApplicationId={id} slug={slug1}></Navbar>
        {props.children}
      </>
    );
  }
  return null;
};

export default Layout;
