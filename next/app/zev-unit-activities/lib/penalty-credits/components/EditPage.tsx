import { getUserInfo } from "@/auth";
import { PenaltyCreditStatus, Role } from "@/prisma/generated/enums";
import { getOrgsMap } from "@/app/lib/data/orgs";
import { PenaltyCreditForm } from "./PenaltyCreditForm";
import { getPenaltyCredit } from "../data";
import { getSerializedPenaltyCredit } from "../utilsServer";

export const EditPage = async (props: { id: string }) => {
  const { userIsGov, userRoles } = await getUserInfo();
  const penaltyCreditId = Number.parseInt(props.id, 10);
  if (!userIsGov || !userRoles.includes(Role.ZEVA_IDIR_USER)) {
    return null;
  }
  const penaltyCredit = await getPenaltyCredit(penaltyCreditId);
  if (
    !penaltyCredit ||
    (penaltyCredit.status !== PenaltyCreditStatus.DRAFT &&
      penaltyCredit.status !== PenaltyCreditStatus.RETURNED_TO_ANALYST)
  ) {
    return null;
  }
  const serializedPenaltyCredit = getSerializedPenaltyCredit(penaltyCredit);
  const orgsMap = await getOrgsMap(null, true);
  return (
    <div className="p-6">
      <h1 className="mb-4 rounded-t bg-primaryBlue px-5 py-4 text-2xl font-bold text-white">
        Edit Penalty Credit
      </h1>
      <div>
        <PenaltyCreditForm
          type="saved"
          orgsMap={orgsMap}
          penaltyCreditId={penaltyCreditId}
          complianceYear={serializedPenaltyCredit.complianceYear}
          orgId={serializedPenaltyCredit.organizationId}
          vehicleClass={serializedPenaltyCredit.vehicleClass}
          zevClass={serializedPenaltyCredit.zevClass}
          modelYear={serializedPenaltyCredit.modelYear}
          numberOfUnits={serializedPenaltyCredit.numberOfunits}
        />
      </div>
    </div>
  );
};
