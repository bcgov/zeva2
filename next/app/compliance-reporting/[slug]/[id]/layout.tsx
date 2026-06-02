import { ComplianceReportingBreadcrumbs } from "../../lib/components/ComplianceReportingBreadcrumbs";

const Layout = async (props: {
  children: React.ReactNode;
  params: Promise<{ slug: string; id: string }>;
}) => {
  const { slug, id } = await props.params;

  return (
    <>
      <ComplianceReportingBreadcrumbs slug={slug} id={id} />
      {props.children}
    </>
  );
};

export default Layout;
