import { getAgreements } from "../data";
import { AgreementTable } from "./AgreementTable";
import { getSerializedAgreements } from "../utilsServer";

export const AgreementList = async (props: {
  userIsGov: boolean;
  canCreateAgreement: boolean;
}) => {
  const agreements = await getAgreements();
  const serializedAgreements = getSerializedAgreements(agreements);
  return (
    <AgreementTable
      agreements={serializedAgreements}
      userIsGov={props.userIsGov}
      canCreateAgreement={props.canCreateAgreement}
    />
  );
};
