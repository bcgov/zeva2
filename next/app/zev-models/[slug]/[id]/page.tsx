import { redirect } from "next/navigation";

const Page = async (props: {
  params: Promise<{ slug: string; id: string }>;
}) => {
  const { slug, id } = await props.params;
  redirect(`/zev-models/${slug}/${id}/details`);
};

export default Page;
