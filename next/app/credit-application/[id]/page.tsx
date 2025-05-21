import { getUserInfo } from "@/auth";
import { Download } from "../lib/components/Download";
import { getSupplierFileInfo, validateCreditApplication } from "../lib/actions";
import { Role } from "@/prisma/generated/client";
import { AnalystUpload } from "../lib/components/AnalystUpload";

const Page = async (props: { params: Promise<{ id: string }> }) => {
  const args = await props.params;
  const id = parseInt(args.id, 10);
  const getSupplierFileDownloadInfo = async () => {
    "use server";
    return await getSupplierFileInfo(id);
  };
  const { userIsGov, userRoles } = await getUserInfo();
  if (userIsGov) {
    if (userRoles.some((role) => role === Role.ENGINEER_ANALYST)) {
      const getGovFileUrl = async () => {
        "use server";
        return await validateCreditApplication(id);
      };
      const govFileName =
        "validated-CA" + id + "-" + new Date().toISOString() + ".xlsx";
      return (
        <div>
          <Download
            getDownloadInfo={getSupplierFileDownloadInfo}
            text="Download Supplier's Submission"
          />
          <Download
            getDownloadInfo={getGovFileUrl}
            fileName={govFileName}
            text="Download Validated Submission"
          />
          <AnalystUpload />
        </div>
      );
    } else if (userRoles.some((role) => role === Role.DIRECTOR)) {

    }
  }
  return (
    <Download
      getDownloadInfo={getSupplierFileDownloadInfo}
      text="Download Your Submission"
    />
  );
};

export default Page;
