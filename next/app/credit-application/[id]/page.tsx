import { getUserInfo } from "@/auth";
import { CreditApplicationStatus, Role } from "@/prisma/generated/client";
import { getCreditApplication } from "../lib/data";
import { ContentCard } from "@/app/lib/components";
import { DownloadSupplierFile } from "../lib/components/DownloadSupplierFile";
import { AnalystView } from "../lib/components/AnalystView";
import { DirectorView } from "../lib/components/DirectorView";

const Page = async (props: { params: Promise<{ id: string }> }) => {
  const args = await props.params;
  const id = parseInt(args.id, 10);
  const creditApplication = await getCreditApplication(id);
  if (
    !creditApplication ||
    creditApplication.status === CreditApplicationStatus.DELETED
  ) {
    return null;
  }
  const { userIsGov, userRoles } = await getUserInfo();
  const supplierSubmission = (
    <ContentCard title="Download Submission">
      <DownloadSupplierFile creditApplicationId={id} userIsGov={userIsGov} />
    </ContentCard>
  );
  if (userIsGov) {
    const applicationStatus = creditApplication.status;
    if (userRoles.some((role) => role === Role.ENGINEER_ANALYST)) {
      return (
        <div>
          {supplierSubmission}
          <AnalystView id={id} status={applicationStatus} />
        </div>
      );
    } else if (userRoles.some((role) => role === Role.DIRECTOR)) {
      return (
        <div>
          {supplierSubmission}
          <DirectorView id={id} status={applicationStatus} />
        </div>
      );
    }
  }
  return <div>{supplierSubmission}</div>;
};

export default Page;
