import { AgreementType } from "@/prisma/generated/client";

export const getAgreementId = (agreement: {
  id: number;
  agreementType: AgreementType;
}) => {
  return agreement.agreementType[0] + "A-" + agreement.id;
};

export const historySelectClause = {
  id: true,
  timestamp: true,
  userAction: true,
  user: {
    select: {
      firstName: true,
      lastName: true,
    },
  },
  agreementComment: {
    select: {
      id: true,
      comment: true,
    },
  },
};
