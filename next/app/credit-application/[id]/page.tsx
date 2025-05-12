import { getUserInfo } from "@/auth";
import { Download } from "../lib/components/Download";
import { getSupplierFileInfo, validateCreditApplication } from "../lib/actions";

const Page = async (props: { params: Promise<{ id: string }> }) => {
  const args = await props.params;
  const id = parseInt(args.id, 10);
  const getSupplierFileDownloadInfo = async () => {
    "use server";
    return await getSupplierFileInfo(id);
  };
  const { userIsGov } = await getUserInfo();
  if (userIsGov) {
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
      </div>
    );
  }
  return (
    <Download
      getDownloadInfo={getSupplierFileDownloadInfo}
      text="Download Your Submission"
    />
  );
};

export default Page;
