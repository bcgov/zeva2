import { getUserInfo } from "@/auth";
import {
  getSupplierTemplateDownloadUrl,
  processSupplierFile,
} from "../lib/actions";
import { redirect } from "next/navigation";
import { Routes } from "@/app/lib/constants";
import { Download } from "../lib/components/Download";
import { SupplierUpload } from "../lib/components/SupplierUpload";
import { ContentCard } from "@/app/lib/components";

const Page = async () => {
  const { userOrgName } = await getUserInfo();
  const retrieveDownloadInfo = async () => {
    "use server";
    return await getSupplierTemplateDownloadUrl();
  };
  const templateFileName =
    "credit-application-template-" +
    userOrgName +
    "-" +
    new Date().toISOString() +
    ".xlsx";
  const processFile = async (objectName: string, fileName: string) => {
    "use server";
    const newApplicationId = await processSupplierFile(objectName, fileName);
    redirect(Routes.CreditApplication + "/" + newApplicationId);
  };
  return (
    <div>
      <ContentCard title="Download Template">
        <Download
          getDownloadInfo={retrieveDownloadInfo}
          fileName={templateFileName}
          text="Download Template"
        />
      </ContentCard>
      <ContentCard title="Upload File">
        <SupplierUpload processFile={processFile} />
      </ContentCard>
    </div>
  );
};

export default Page;
