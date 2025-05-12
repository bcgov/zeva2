import { getUserInfo } from "@/auth";
import {
  getSupplierPutData,
  getSupplierTemplateDownloadUrl,
  processSupplierFile,
} from "../lib/actions";
import { redirect } from "next/navigation";
import { Routes } from "@/app/lib/constants";
import { Download } from "../lib/components/Download";
import { SupplierUpload } from "../lib/components/SupplierUpload";

const Page = async () => {
  const { userOrgName } = await getUserInfo();
  const retrieveDownloadInfo = async () => {
    "use server";
    return await getSupplierTemplateDownloadUrl();
  };
  const retrieveSupplierPutFileData = async () => {
    "use server";
    return await getSupplierPutData();
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
      <Download
        getDownloadInfo={retrieveDownloadInfo}
        fileName={templateFileName}
        text="Download template"
      />
      <SupplierUpload
        getPutData={retrieveSupplierPutFileData}
        processFile={processFile}
      />
    </div>
  );
};

export default Page;
