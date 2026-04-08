import { Suspense } from "react";
import { getUserInfo } from "@/auth";
import { LoadingSkeleton } from "@/app/lib/components/skeletons";
import {
  getModelYears,
  getComplianceRatios,
  getActiveVehicles,
  getUserCreditBalance,
} from "../data";
import { CalculatorForm } from "./CalculatorForm";

export const CalculatorPage = async () => {
  const { userIsGov } = await getUserInfo();
  if (userIsGov) {
    return null;
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
        <h2 className="text-2xl font-semibold text-primaryText mb-4">
          Compliance Calculator
        </h2>
        <div className="text-primaryText space-y-1">
          <p>
            The compliance calculator is to assist in estimating your compliance
            obligation. Enter your estimated total vehicle sales for a model
            year to see an estimated ratio reduction. Enter your estimated total
            ZEVs supplied by model to see an estimate of credits generated from
            these sales.
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
