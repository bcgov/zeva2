"use client";

import axios from "axios";
import Excel from "exceljs";
import { useCallback, useTransition } from "react";
import {
  getSupplierEligibleVehicles,
  getSupplierTemplateDownloadUrl,
} from "../actions";
import { SupplierTemplateSheetNames } from "../constants";
import { getModelYearEnumsToStringsMap } from "@/app/lib/utils/enumMaps";
import { Button } from "@/app/lib/components";
import { LoadingSkeleton } from "@/app/lib/components/skeletons";
import { downloadBuffer } from "@/app/lib/utils/download";

export const SupplierDownload = (props: { userOrgName: string }) => {
  const [isPending, startTransition] = useTransition();

  const handleDownload = useCallback(() => {
    startTransition(async () => {
      try {
        const [url, vehicles] = await Promise.all([
          getSupplierTemplateDownloadUrl(),
          getSupplierEligibleVehicles(),
        ]);
        const response = await axios.get(url, { responseType: "arraybuffer" });
        const template = response.data;
        const workbook = new Excel.Workbook();
        await workbook.xlsx.load(template);
        const vehiclesSheet = workbook.getWorksheet(
          SupplierTemplateSheetNames.ValidVehicles,
        );
        if (vehiclesSheet) {
          const modelYearsMap = getModelYearEnumsToStringsMap();
          vehicles.forEach((vehicle) => {
            vehiclesSheet.addRow([
              vehicle.make,
              vehicle.modelName,
              modelYearsMap[vehicle.modelYear],
            ]);
          });
        }
        const buffer = await workbook.xlsx.writeBuffer();
        const fileName = `credit-application-template-${props.userOrgName}-${new Date().toISOString()}.xlsx`;
        downloadBuffer(fileName, buffer);
      } catch (e) {
        console.error(e);
      }
    });
  }, []);

  if (isPending) {
    return <LoadingSkeleton />;
  }
  return <Button onClick={handleDownload}>Download Template</Button>;
};
