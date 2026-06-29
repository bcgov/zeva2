"use client";

import axios from "axios";
import { Dispatch, SetStateAction, useCallback, useTransition } from "react";
import { Button, StatusBanner } from "@/app/lib/components";
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
    <div className="flex flex-col border border-dividerMedium rounded">
      <div className="px-5 py-4 font-bold text-xl bg-disabledBG">
        Forecast Report
      </div>
      <div className="flex flex-col gap-2 px-5 py-4 bg-[#F4F4F4]">
        <span className="font-bold text-lg">
          Step 1: Download the Forecast Report Template
        </span>
        <span>After downloading the template, please fill it out.</span>
      </div>
      <div className="px-5 py-4">
        <Button
          onClick={handleDownloadForecastTemplate}
          variant="secondary"
          disabled={isPending || props.disabled}
          icon={<FontAwesomeIcon icon={faDownload} />}
        >
          Download Template
        </Button>
      </div>
      <div className="flex flex-col gap-2 px-5 py-4 bg-[#F4F4F4]">
        <span className="font-bold text-lg">
          Step 2: Upload Forecast Report
        </span>
        <span>Upload the filled out forecast report template.</span>
      </div>
      <div className="px-5 py-4">
        <div className="flex flex-col gap-5">
          {props.forecasts.length === 1 && (
            <StatusBanner
              variant="success"
              title="File uploaded successfully."
              primaryText="To upload a new file, delete the current one."
            />
          )}
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
    </div>
  );
};
