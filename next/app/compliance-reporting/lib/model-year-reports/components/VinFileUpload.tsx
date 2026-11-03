"use client";

import { downloadBuffer } from "@/app/lib/utils/download";
import { getModelYearEnumsToStringsMap } from "@/app/lib/utils/enumMaps";
import { ModelYear } from "@/prisma/generated/enums";
import axios from "axios";
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useMemo,
  useTransition,
} from "react";
import { getVinListData, getVinListTemplateUrl } from "../actions";
import { populateVinListTemplate } from "../utilsClient";
import { Button, StatusBanner } from "@/app/lib/components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDownload,
  faFilePen,
  faSquareCheck,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { Dropzone } from "@/app/lib/components/Dropzone";
import { VinListError } from "../constants";

export const VinFileUpload = (props: {
  modelYear: ModelYear;
  vinLists: File[];
  setVinLists: Dispatch<SetStateAction<File[]>>;
  disabled: boolean;
  vinListError: VinListError | null;
  setVinListError: Dispatch<SetStateAction<VinListError | null>>;
}) => {
  const [isPending, startTransition] = useTransition();
  const modelYearsMap = useMemo(() => {
    return getModelYearEnumsToStringsMap();
  }, []);

  const handleDownloadVinList = useCallback(() => {
    startTransition(async () => {
      const templateUrl = await getVinListTemplateUrl();
      const [templateResponse, vinListResponse] = await Promise.all([
        axios.get(templateUrl, {
          responseType: "arraybuffer",
        }),
        getVinListData(props.modelYear),
      ]);
      if (vinListResponse.responseType === "data") {
        const workbook = await populateVinListTemplate(
          templateResponse.data,
          vinListResponse.data,
        );
        const workbookBuf = await workbook.xlsx.writeBuffer();
        const fileName = `vin-list-${modelYearsMap[props.modelYear]}.xlsx`;
        downloadBuffer(fileName, workbookBuf);
      }
    });
  }, [props.modelYear, modelYearsMap]);

  const handleDownloadValidationResults = useCallback(() => {
    const workbook = props.vinListError?.workbook;
    if (workbook) {
      startTransition(async () => {
        const workbookBuf = await workbook.xlsx.writeBuffer();
        const fileName = `vin-list-${modelYearsMap[props.modelYear]}-validation-results.xlsx`;
        downloadBuffer(fileName, workbookBuf);
      });
    }
  }, [props.vinListError]);

  const validationSubResult = useMemo(() => {
    const vinListError = props.vinListError;
    if (!vinListError) {
      return null;
    }
    return (
      <>
        <div className="flex flex-row items-center gap-6">
          <span className="flex flex-row items-center gap-3">
            <FontAwesomeIcon icon={faFilePen} className="text-info" />
            <span className="flex flex-row items-center gap-4">
              <span className="font-bold">Total VIN Records</span>
              <span>{vinListError.numberOfRecords}</span>
            </span>
          </span>
          <span className="flex flex-row items-center gap-3">
            <FontAwesomeIcon icon={faSquareCheck} className="text-success" />
            <span className="flex flex-row items-center gap-4">
              <span className="font-bold">Reportable ZEV VIN Records</span>
              <span>{vinListError.numberOfValidRecords}</span>
            </span>
          </span>
          <span className="flex flex-row items-center gap-3">
            <FontAwesomeIcon
              icon={faTriangleExclamation}
              className="text-error"
            />
            <span className="flex flex-row items-center gap-4">
              <span className="font-bold">Validation Errors</span>
              <span>
                {vinListError.numberOfRecords -
                  vinListError.numberOfValidRecords}
              </span>
            </span>
          </span>
        </div>
        <div>
          <Button
            onClick={handleDownloadValidationResults}
            variant="secondary"
            disabled={isPending || props.disabled}
            icon={<FontAwesomeIcon icon={faDownload} />}
          >
            Download Validation Results
          </Button>
        </div>
      </>
    );
  }, [
    props.vinListError,
    handleDownloadValidationResults,
    isPending,
    props.disabled,
  ]);

  return (
    <div className="flex flex-col border border-dividerMedium rounded-t">
      <div className="flex flex-col gap-2 p-5 bg-disabledSurface">
        <h2 className="text-xl font-bold">
          {modelYearsMap[props.modelYear]} Model Year VIN Records
        </h2>
        <StatusBanner
          title="Use this section to review and manage reportable vehicle records associated with this Model Year Report."
          primaryText={null}
          secondaryText={
            <ul className="list-disc list-inside">
              <li>
                Download the VIN records generated from previously submitted
                Credit Applications for this Model Year.
              </li>
              <li>
                Review the spreadsheet and add any missing reportable ZEV VINs.
              </li>
              <li>
                Include all reportable ZEVs of the reported model year supplied
                on or before the applicable compliance date, including
                applicable Class C VINs and vehicles for which credits have not
                been issued.
              </li>
              <li>
                Upload the completed spreadsheet to establish the vehicle
                records for this Model Year Report.
              </li>
            </ul>
          }
          variant="info"
        />
      </div>
      <hr className="border-overlayModal"></hr>
      <div className="flex flex-col gap-2 px-5 py-4 bg-whiteSmoke">
        <h2 className="text-lg font-bold">Step 1: Download VIN Records</h2>
        <ul className="list-disc list-inside">
          <li>
            Download the available VIN and vehicle information from Credit
            Applications previously submitted for this model year.
          </li>
        </ul>
      </div>
      <div className="p-5">
        <Button
          onClick={handleDownloadVinList}
          variant="secondary"
          disabled={isPending || props.disabled}
          icon={<FontAwesomeIcon icon={faDownload} />}
        >
          Download VIN Records
        </Button>
      </div>
      <hr className="border-overlayModal"></hr>
      <div className="flex flex-col gap-2 px-5 py-4 bg-whiteSmoke">
        <h2 className="text-lg font-bold">Step 2: Review and Update Records</h2>
        <ul className="list-disc list-inside">
          <li>
            Review the downloaded spreadsheet and add any missing reportable ZEV
            VINs.
          </li>
          <li>
            The Model Year Report must include all reportable ZEVs of the
            reported model year supplied on or before the applicable compliance
            date, including applicable Class C VINs and vehicles for which
            credits have not been issued.
          </li>
        </ul>
      </div>
      <hr className="border-overlayModal"></hr>
      <div className="flex flex-col gap-2 px-5 py-4 bg-whiteSmoke">
        <h2 className="text-lg font-bold">Step 3: Upload VIN Records</h2>
        <span>
          Upload the completed VIN spreadsheet for validation and reporting
          purposes.
        </span>
      </div>
      <div className="p-5">
        <div className="flex flex-col gap-5">
          {props.vinLists.length === 1 && (
            <StatusBanner
              variant="success"
              title="File uploaded successfully."
              primaryText={null}
              secondaryText="The uploaded VIN spreadsheet will be validated when you generate the report."
            />
          )}
          <Dropzone
            files={props.vinLists}
            setFiles={props.setVinLists}
            maxNumberOfFiles={1}
            allowedFileTypes={{
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
                [".xlsx"],
            }}
            disabled={props.disabled || isPending}
            handleRemove={() => {
              props.setVinListError(null);
            }}
          />
        </div>
      </div>
      {props.vinListError && (
        <>
          <hr className="border-overlayModal"></hr>
          <div className="flex flex-col px-5 py-4 bg-whiteSmoke">
            <h2 className="text-lg font-bold">Validation Summary</h2>
          </div>
          {props.vinListError.type === "general" && (
            <div className="p-5">
              <StatusBanner
                title="Unable to Process File!"
                primaryText={null}
                secondaryText={
                  <div className="flex flex-col">
                    <span>
                      The uploaded file does not match the required VIN
                      reporting template. To continue:
                    </span>
                    <ol className="list-decimal list-inside">
                      <li>Download the VIN Records template.</li>
                      <li>Review the file structure and required fields.</li>
                      <li>Upload a valid VIN reporting spreadsheet.</li>
                    </ol>
                  </div>
                }
                variant="error"
              />
            </div>
          )}
          {props.vinListError.type === "partial" && (
            <div className="flex flex-col gap-6 p-5">
              <StatusBanner
                title="Some vehicle records could not be validated."
                primaryText={null}
                secondaryText="The uploaded VIN spreadsheet contains one or more validation issues that must be resolved before the Model Year Report can be generated.
Download the Validation Results file to review the affected records and associated error messages."
                variant="warning"
              />
              {validationSubResult}
            </div>
          )}
          {props.vinListError.type === "no-valid-records" && (
            <div className="flex flex-col gap-6 p-5">
              <StatusBanner
                title="No valid reportable vehicle records were identified in the uploaded spreadsheet."
                primaryText={null}
                secondaryText="Review the Validation Results file, correct the identified issues, and upload a revised spreadsheet before generating the report."
                variant="warning"
              />
              {validationSubResult}
            </div>
          )}
        </>
      )}
    </div>
  );
};
