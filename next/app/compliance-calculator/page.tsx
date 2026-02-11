import { Suspense } from "react";
import { getUserInfo } from "@/auth";
import { redirect } from "next/navigation";
import { Routes } from "../lib/constants";
import { LoadingSkeleton } from "../lib/components/skeletons";
import {
  getModelYears,
  getComplianceRatios,
  getActiveVehicles,
  getUserCreditBalance,
} from "./lib/data";
import { CalculatorForm } from "./lib/components/CalculatorForm";

const Page = async () => {
  const { userIsGov, userRoles } = await getUserInfo();

  // Only allow non-government users with EDIT_SALES permission (BCEID users)
  if (userIsGov) {
    redirect(Routes.ComplianceReporting);
  }

  // Check if user has appropriate role
  const hasEditSales =
    userRoles.includes("ZEVA_BCEID_USER" as any) ||
    userRoles.includes("SIGNING_AUTHORITY" as any) ||
    userRoles.includes("ORGANIZATION_ADMINISTRATOR" as any);

  if (!hasEditSales) {
    redirect(Routes.ComplianceReporting);
  }

  const [modelYearList, complianceRatios, vehicleModels, creditBalance] =
    await Promise.all([
      getModelYears(),
      getComplianceRatios(),
      getActiveVehicles(),
      getUserCreditBalance(),
    ]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Compliance Calculator</h2>
        <div className="text-gray-700 space-y-2">
          <p>
            The compliance calculator is to assist in estimating your compliance
            obligation.
          </p>
          <p>
            Enter your estimated total vehicle sales for a model year to see an
            estimated ratio reduction.
          </p>
          <p>
            Enter your estimated total ZEVs supplied by model to see an estimate of
            credits generated from these sales.
          </p>
        </div>
      </div>
      <Suspense fallback={<LoadingSkeleton />}>
        <CalculatorForm
          modelYearList={modelYearList}
          complianceRatios={complianceRatios}
          vehicleModels={vehicleModels}
          creditBalance={creditBalance}
        />
      </Suspense>
    </div>
  );
};

export default Page;
