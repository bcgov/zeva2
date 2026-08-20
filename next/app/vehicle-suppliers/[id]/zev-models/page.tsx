import { getPageParams, pageStringParams } from "@/app/lib/utils/nextPage";
import { VehicleList } from "../../lib/components/VehicleList";

const Page = async (props: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<pageStringParams>;
}) => {
  const args = await props.params;
  const orgId = Number.parseInt(args.id, 10);
  const searchParams = await props.searchParams;
  const { page, pageSize, filters, sorts } = getPageParams(searchParams, 1, 10);

  return (
    <VehicleList
      orgId={orgId}
      page={page}
      pageSize={pageSize}
      filters={filters}
      sorts={sorts}
    />
  );
};

export default Page;
