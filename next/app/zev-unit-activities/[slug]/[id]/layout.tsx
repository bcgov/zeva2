import { ActivityDetailNav } from "@/app/zev-unit-activities/lib/components/ActivityDetailNav";

const Layout = async (props: {
  children: React.ReactNode;
  params: Promise<{ slug: string; id: string }>;
}) => {
  const { slug, id } = await props.params;
  return (
    <>
      <ActivityDetailNav slug={slug} id={id} />
      {props.children}
    </>
  );
};

export default Layout;
