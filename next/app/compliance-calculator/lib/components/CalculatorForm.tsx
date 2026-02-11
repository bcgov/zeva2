"use client";

import { useState, useCallback, useEffect } from "react";
import { ModelYear } from "@/prisma/generated/client";
import {
  ComplianceRatio,
  SupplierSize,
  ComplianceNumbers,
  EstimatedModelSale,
  VehicleModel,
  CreditBalance,
} from "../types";
import { CalculatorInputs } from "./CalculatorInputs";
import { CalculatorTotals } from "./CalculatorTotals";
import { CalculatorModelTable } from "./CalculatorModelTable";

type CalculatorFormProps = {
  modelYearList: ModelYear[];
  complianceRatios: ComplianceRatio[];
  vehicleModels: VehicleModel[];
  creditBalance: CreditBalance;
};

export const CalculatorForm = ({
  modelYearList,
  complianceRatios,
  vehicleModels,
  creditBalance,
}: CalculatorFormProps) => {
  const [selectedYearOption, setSelectedYearOption] = useState<ModelYear | "">("");
  const [supplierSize, setSupplierSize] = useState<SupplierSize>("");
  const [totalSales, setTotalSales] = useState<string>("");
  const [complianceYearInfo, setComplianceYearInfo] = useState<ComplianceRatio | null>(
    null
  );
  const [complianceNumbers, setComplianceNumbers] = useState<ComplianceNumbers>({
    total: "",
    classA: "",
    remaining: "",
  });
  const [estimatedModelSales, setEstimatedModelSales] = useState<EstimatedModelSale[]>(
    []
  );

  const calculateNumbers = useCallback(() => {
    if (totalSales && supplierSize && complianceYearInfo) {
      const salesNum = parseFloat(totalSales);
      const total =
        Math.round(salesNum * (complianceYearInfo.complianceRatio / 100) * 100) / 100;
      const classA =
        supplierSize === "large"
          ? Math.round(salesNum * (complianceYearInfo.zevClassA / 100) * 100) / 100
          : "NA";
      const remaining =
        supplierSize === "large" && typeof classA === "number"
          ? Math.round((total - classA) * 100) / 100
          : "NA";

      setComplianceNumbers({ total, classA, remaining });
    } else {
      setComplianceNumbers({ total: "", classA: "", remaining: "" });
    }
  }, [totalSales, supplierSize, complianceYearInfo]);

  useEffect(() => {
    calculateNumbers();
  }, [calculateNumbers]);

  const handleInputChange = useCallback(
    (id: string, value: string) => {
      if (id === "model-year") {
        setSelectedYearOption(value as ModelYear);
        const yearInfo = complianceRatios.find((ratio) => ratio.modelYear === value);
        setComplianceYearInfo(yearInfo || null);
      } else if (id === "supplier-size") {
        setSupplierSize(value as SupplierSize);
      } else if (id === "total-sales-number") {
        setTotalSales(value);
      }
    },
    [complianceRatios]
  );

  const handleModelSaleChange = useCallback(
    (modelId: number, salesNum: number, creditValue: number, creditClass: string) => {
      const totalValue = creditValue * salesNum;
      setEstimatedModelSales((prev) => {
        const existingIndex = prev.findIndex((sale) => sale.id === modelId);
        if (salesNum === 0 && existingIndex >= 0) {
          // Remove if sales is 0
          return prev.filter((sale) => sale.id !== modelId);
        }
        if (existingIndex >= 0) {
          // Update existing
          const newSales = [...prev];
          newSales[existingIndex] = {
            id: modelId,
            value: totalValue,
            estimatedSalesNum: salesNum,
            creditClass: creditClass as any,
          };
          return newSales;
        } else if (salesNum > 0) {
          // Add new
          return [
            ...prev,
            {
              id: modelId,
              value: totalValue,
              estimatedSalesNum: salesNum,
              creditClass: creditClass as any,
            },
          ];
        }
        return prev;
      });
    },
    []
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
        <CalculatorInputs
          modelYearList={modelYearList}
          selectedYearOption={selectedYearOption}
          supplierSize={supplierSize}
          complianceYearInfo={complianceYearInfo}
          onInputChange={handleInputChange}
        />
        <CalculatorTotals
          complianceNumbers={complianceNumbers}
          supplierSize={supplierSize}
          estimatedModelSales={estimatedModelSales}
          creditBalance={creditBalance}
        />
      </div>
      <CalculatorModelTable
        models={vehicleModels}
        estimatedModelSales={estimatedModelSales}
        onModelSaleChange={handleModelSaleChange}
      />
    </div>
  );
};
