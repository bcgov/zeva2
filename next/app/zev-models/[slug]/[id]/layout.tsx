import { IndividualNavbar } from "../../lib/components/IndividualNavbar";

const Layout = async (props: {
  children: React.ReactNode;
  params: Promise<{ slug: string; id: string }>;
}) => {
  const args = await props.params;
  const id = Number.parseInt(args.id, 10);
  const slug = args.slug;

  return (
    <>
      <IndividualNavbar
        slug={slug}
        vehicleId={id}
        modelName={`ZEV Model ${id}`}
      />
      {props.children}
    </>
  );
};

export default Layout;
