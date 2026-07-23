const Layout = async (props: {
  children: React.ReactNode;
  params: Promise<{ slug: string; id: string; slug1: string }>;
}) => {
  const { slug, slug1 } = await props.params;
  if (
    slug === "credit-applications" &&
    (slug1 === "validated" || slug1 === "model-name-mismatches")
  ) {
    return props.children;
  }
  return null;
};

export default Layout;
