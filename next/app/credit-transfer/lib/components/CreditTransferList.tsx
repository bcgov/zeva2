import { getCreditTransfers } from "../data";
import { CreditTransfersTable } from "./CreditTransfersTable";
import { getSerializedTransfers } from "../utilsServer";
import { getUserInfo } from "@/auth";

export const CreditTransferList = async () => {
  const { userIsGov } = await getUserInfo();
  const transfers = await getCreditTransfers();
  const serializedTransfers = getSerializedTransfers(transfers, userIsGov);
  return <CreditTransfersTable transfers={serializedTransfers} />;
};
