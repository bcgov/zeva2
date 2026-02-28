import {
  getAdjacentYear,
  getComplianceYear,
} from "@/app/lib/utils/complianceYear";
import { prisma } from "@/lib/prisma";
import { CreditApplicationStatus } from "@/prisma/generated/enums";

// run this job on midnight of Oct.1 each year,
// so that any "in-process" CA is flagged as being part of a MYR,
// so that:
// (1) an additional check will be performed on the CA's records to ensure that 13(3)(b) is satisfied
// (2) if the CA is issued, its associated transaction will have a Sep.30 date
export const handleFlagInProcessCAsJob = async () => {
  const currentCy = getComplianceYear(new Date());
  const previousCy = getAdjacentYear("prev", currentCy);
  await prisma.creditApplication.updateMany({
    where: {
      status: {
        in: [
          CreditApplicationStatus.SUBMITTED,
          CreditApplicationStatus.RECOMMEND_APPROVAL,
          CreditApplicationStatus.RETURNED_TO_ANALYST,
        ],
      },
    },
    data: {
      partOfMyrModelYear: previousCy,
      mustRevalidate: true,
    },
  });
};
