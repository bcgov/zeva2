import { getUserInfo } from "@/auth";
import { processSupplierFile } from "../lib/actions";
import { redirect } from "next/navigation";
import { Routes } from "@/app/lib/constants";
import { SupplierUpload } from "../lib/components/SupplierUpload";
import { ContentCard } from "@/app/lib/components";
import { SupplierDownload } from "../lib/components/SupplierDownload";

const Page = async () => {
  const { userOrgName } = await getUserInfo();

  const processFile = async (objectName: string, fileName: string) => {
    "use server";
    const newApplicationId = await processSupplierFile(objectName, fileName);
    if (newApplicationId) {
      redirect(`${Routes.CreditApplication}/${newApplicationId}`);
    }
  };
  return (
    <div>
      <ContentCard title="Download Template">
        <SupplierDownload userOrgName={userOrgName} />
      </ContentCard>
      <ContentCard title="Upload File">
        <SupplierUpload processFile={processFile} />
      </ContentCard>
    </div>
  );
};

export default Page;
