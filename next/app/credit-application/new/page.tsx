import { getUserInfo } from "@/auth";
import { SupplierUpload } from "../lib/components/SupplierUpload";
import { ContentCard } from "@/app/lib/components";
import { SupplierDownload } from "../lib/components/SupplierDownload";

const Page = async () => {
  const { userOrgName } = await getUserInfo();
  return (
    <div>
      <ContentCard title="Download Template">
        <SupplierDownload userOrgName={userOrgName} />
      </ContentCard>
      <ContentCard title="Upload File">
        <SupplierUpload />
      </ContentCard>
    </div>
  );
};

export default Page;
