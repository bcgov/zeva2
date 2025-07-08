import { getUserInfo } from "@/auth";
import { Role } from "@/prisma/generated/client";
import { getOrgNamesAndIds } from "../lib/data";
import { PenaltyCreditCreateForm } from "../lib/components/PenaltyCreditCreateForm";
import { analystSubmit, PenaltyCreditPayload } from "../lib/actions";
import { redirect } from "next/navigation";
import { Routes } from "@/app/lib/constants";

const Page = async () => {
  const { userIsGov, userRoles } = await getUserInfo();
  if (!userIsGov || !userRoles.includes(Role.ENGINEER_ANALYST)) {
    return null;
  }
  const orgNamesAndIds = await getOrgNamesAndIds();
  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">
        Submit Penalty Credits To Director
      </h1>
      <PenaltyCreditCreateForm orgNamesAndIds={orgNamesAndIds} />
    </div>
  );
};

export default Page;
