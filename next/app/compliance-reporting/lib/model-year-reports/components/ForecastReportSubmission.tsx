"use client";

import axios from "axios";
import { Dispatch, SetStateAction, useCallback, useTransition } from "react";
import { Button } from "@/app/lib/components";
import { Dropzone } from "@/app/lib/components/Dropzone";
import { ModelYear } from "@/prisma/generated/enums";
import { getForecastTemplateUrl } from "../actions";
import { populateForecastTemplate } from "../utilsClient";
import { downloadBuffer } from "@/app/lib/utils/download";
import { getModelYearEnumsToStringsMap } from "@/app/lib/utils/enumMaps";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload } from "@fortawesome/free-solid-svg-icons";

export const ForecastReportSubmission = (props: {
  modelYear: ModelYear;
  forecasts: File[];
  setForecasts: Dispatch<SetStateAction<File[]>>;
  disabled: boolean;
}) => {
  const [isPending, startTransition] = useTransition();

  const handleDownloadForecastTemplate = useCallback(() => {
    startTransition(async () => {
      const templateUrl = await getForecastTemplateUrl();
      const templateResponse = await axios.get(templateUrl, {
        responseType: "arraybuffer",
      });
      const template = await populateForecastTemplate(
        templateResponse.data,
        props.modelYear,
      );
      const templateBuf = await template.xlsx.writeBuffer();
      const modelYearsMap = getModelYearEnumsToStringsMap();
      const fileName = `forecast-report-${modelYearsMap[props.modelYear]}.xlsx`;
      downloadBuffer(fileName, templateBuf);
    });
  }, [props.modelYear]);

  return (
    <div className="flex flex-col border border-dividerMedium/40">
      <div className="p-2 font-bold font-lg bg-gray-100">Forecast Report</div>
      <div className="p-2 font-semibold bg-gray-50">
        Step 1: Download the Forecast Report Template and fill it out
      </div>
      <div className="p-2">
        <Button
          onClick={handleDownloadForecastTemplate}
          variant="secondary"
          disabled={isPending || props.disabled}
          icon={<FontAwesomeIcon icon={faDownload} />}
        >
          Download Template
        </Button>
      </div>
      <div className="p-2 font-semibold bg-gray-50">
        Step 2: Upload Forecast Report
      </div>
      <div className="p-2">
        <Dropzone
          files={props.forecasts}
          setFiles={props.setForecasts}
          maxNumberOfFiles={1}
          allowedFileTypes={{
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
              [".xlsx"],
          }}
          disabled={props.disabled}
        />
      </div>
    </div>
  );
};
