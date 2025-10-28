import { Navbar } from "../../lib/components/Navbar";

const Layout = async (props: {
  children: React.ReactNode;
  params: Promise<{ id: string; slug: string }>;
}) => {
  const { id, slug } = await props.params;
  if (slug === "validated" || slug === "model-name-mismatches") {
    return (
      <>
        <Navbar creditApplicationId={id} slug={slug}></Navbar>
        {props.children}
      </>
    );
  }
  return null;
};

export default Layout;
