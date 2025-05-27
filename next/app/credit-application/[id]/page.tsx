import { getUserInfo } from "@/auth";
import { Download } from "../lib/components/Download";
import {
  getSupplierFileInfo,
  validateCreditApplication,
  getGovFileDownloadInfo,
} from "../lib/actions";
import { CreditApplicationStatus, Role } from "@/prisma/generated/client";
import { AnalystUpload } from "../lib/components/AnalystUpload";
import { getCreditApplication } from "../lib/data";
import { ContentCard } from "@/app/lib/components";
import { DirectorReview } from "../lib/components/DirectorReview";

const Page = async (props: { params: Promise<{ id: string }> }) => {
  const args = await props.params;
  const id = parseInt(args.id, 10);
  const getSupplierFileDownloadInfo = async () => {
    "use server";
    return await getSupplierFileInfo(id);
  };
  const creditApplication = await getCreditApplication(id);
  if (
    !creditApplication ||
    creditApplication.status === CreditApplicationStatus.DELETED
  ) {
    return null;
  }
  const { userIsGov, userRoles } = await getUserInfo();
  console.log(userIsGov);
  if (userIsGov) {
    const applicationStatus = creditApplication.status;
    const supplierSubmission = (
      <ContentCard title="Download Supplier's Submission">
        <Download
          getDownloadInfo={getSupplierFileDownloadInfo}
          text="Download Supplier's Submission"
        />
      </ContentCard>
    );

    const getGovSubmissionInfo = async () => {
      "use server";
      return await getGovFileDownloadInfo(id);
    };
    const analystSubmission = applicationStatus !==
      CreditApplicationStatus.SUBMITTED &&
      applicationStatus !== CreditApplicationStatus.RETURNED_TO_ANALYST && (
        <ContentCard title="Download Analyst's Submission">
          <Download
            getDownloadInfo={getGovSubmissionInfo}
            text="Download Analyst's Submission"
          />
        </ContentCard>
      );

    if (userRoles.some((role) => role === Role.ENGINEER_ANALYST)) {
      const getGovFileUrl = async () => {
        "use server";
        return await validateCreditApplication(id);
      };
      const govFileName =
        "validated-CA" + id + "-" + new Date().toISOString() + ".xlsx";

      return (
        <div>
          {supplierSubmission}
          {(applicationStatus === CreditApplicationStatus.SUBMITTED ||
            applicationStatus ===
              CreditApplicationStatus.RETURNED_TO_ANALYST) && (
            <>
              <ContentCard title="Download Validated Submission">
                <Download
                  getDownloadInfo={getGovFileUrl}
                  fileName={govFileName}
                  text="Download Validated Submission"
                />
              </ContentCard>
              <ContentCard title="Upload">
                <AnalystUpload creditApplicationId={id} />
              </ContentCard>
            </>
          )}
          {analystSubmission}
        </div>
      );
    } else if (userRoles.some((role) => role === Role.DIRECTOR)) {
      return (
        <div>
          {supplierSubmission}
          {analystSubmission}
          {(applicationStatus === CreditApplicationStatus.RECOMMEND_APPROVAL ||
            applicationStatus ===
              CreditApplicationStatus.RECOMMEND_REJECTION) && (
            <ContentCard title="Director Stuff">
              <DirectorReview
                creditApplicationId={id}
                status={applicationStatus}
              />
            </ContentCard>
          )}
        </div>
      );
    }
  }
  return (
    <ContentCard title="Download Your Submission">
      <Download
        getDownloadInfo={getSupplierFileDownloadInfo}
        text="Download Your Submission"
      />
    </ContentCard>
  );
};

export default Page;
