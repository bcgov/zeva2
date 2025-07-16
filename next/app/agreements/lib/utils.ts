import { AgreementType, Prisma } from "@/prisma/generated/client";
import { AgreementSparse } from "./data";

export const getAgreementId = (data: {
  id: number,
  agreementType: AgreementType,
  optionalId?: string | null,
}) => {
  return data.optionalId ?? (
    (data.agreementType == AgreementType.INITIATIVE ? "IA-" : "PA-") + data.id
  )
};
