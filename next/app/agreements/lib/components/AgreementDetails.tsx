"use client";

import { ZevClass } from "@/prisma/generated/client";
import { Button } from "@/app/lib/components";
import { enumToTitleString } from "@/lib/utils/convertEnums";
import { getAgreementId } from "../utils";
import { AgreementDetailsType, AgreementHistoryType } from "../services";
import { useState } from "react";
import { AgreementHistories } from "./AgreementHistories";
import { AttachmentsList } from "@/app/lib/components/AttachmentsList";
import { AttachmentsDownload } from "@/app/lib/components/AttachmentsDownload";
import { getAgreementAttachmentDownloadUrls } from "../action";

const mainDivClass = "grid grid-cols-[220px_1fr]";
const fieldLabelClass = "py-1 font-semibold text-primaryBlue";
const fieldWithBoarderClass = "p-2 border border-gray-300 rounded bg-white";
const buttonStyle = "px-2 py-1 min-w-16 self-center text-center";
const secondaryButtonClass =
  "bg-white border border-primaryBlue text-primaryBlue";
const warningButtonClass = "bg-white border border-red-500 text-red-500";

export const AgreementDetails = (props: {
  agreement: AgreementDetailsType;
  backLink: string;
  editLink?: string;
  handleRecommendApproval?: () => void;
  handleReturnToAnalyst?: () => void;
  handleDeleteAgreement?: () => void;
  handleIssueAgreement?: () => void;
  handleAddComment: (comment: string) => Promise<AgreementHistoryType | null>;
}) => {
  const {
    agreement,
    backLink,
    editLink,
    handleRecommendApproval,
    handleReturnToAnalyst,
    handleDeleteAgreement,
    handleIssueAgreement,
    handleAddComment,
  } = props;

  const {
    agreementType,
    referenceId,
    status,
    effectiveDate,
    comment,
    organization,
    agreementContent,
    agreementHistory,
    agreementAttachment,
  } = agreement;

  const [isProcessing, setIsProcessing] = useState(false);
  const ready = agreementContent.length > 0 && effectiveDate;

  const contentsByModelYear = agreementContent.reduce(
    (groupByMY, content) => {
      if (!groupByMY[content.modelYear]) {
        groupByMY[content.modelYear] = [];
      }
      groupByMY[content.modelYear].push(content);
      return groupByMY;
    },
    {} as Record<string, { zevClass: ZevClass; numberOfUnits: number }[]>,
  );

  if (isProcessing) {
    return <div className="p-6 font-semibold">Processing...</div>;
  }

  return (
    <>
      <h2 className="text-xl font-semibold text-primaryBlue pb-4">
        {enumToTitleString(agreementType)} Agreement
      </h2>
      <div>
        <div className={mainDivClass}>
          <span className={fieldLabelClass}>Status:</span>{" "}
          {enumToTitleString(status)}
        </div>

        <div className={mainDivClass}>
          <span className={fieldLabelClass}>ID:</span>{" "}
          {getAgreementId(agreement)}
        </div>

        <div className={mainDivClass}>
          <span className={fieldLabelClass}>Reference ID:</span> {referenceId}
        </div>

        <div className={mainDivClass}>
          <span className={fieldLabelClass}>Supplier:</span> {organization.name}
        </div>

        <div className={mainDivClass}>
          <span className={fieldLabelClass}>Effective Date:</span>{" "}
          {effectiveDate?.toLocaleDateString()}
          {!effectiveDate && (
            <span className="text-red-500">
              Must be entered before submitting.
            </span>
          )}
        </div>

        <div className="mt-4">
          <p className={fieldLabelClass}>ZEV Units</p>
          <div className={fieldWithBoarderClass}>
            {agreementContent.length === 0 ? (
              <>
                No Entry
                <p className="text-red-500">
                  At least one ZEV unit entry is required before submitting.
                </p>
              </>
            ) : (
              Object.entries(contentsByModelYear).map(
                ([modelYear, contents]) => (
                  <div key={modelYear} className="mb-2">
                    <p className="font-semibold">
                      Model Year {modelYear.substring(3)}
                    </p>
                    {contents.map((content, index) => (
                      <p key={index} className="ml-4">
                        Class {content.zevClass}: {content.numberOfUnits}
                      </p>
                    ))}
                  </div>
                ),
              )
            )}
          </div>
        </div>

        <div className="mt-4">
          <p className={fieldLabelClass}>Comment to Supplier</p>
          <div className={`${fieldWithBoarderClass} min-h-[100px]`}>
            {comment ?? ""}
          </div>
        </div>

        {agreementHistory && (
          <div className="mt-4">
            <p className={fieldLabelClass}>
              Government Internal History and Comments
            </p>
            <AgreementHistories
              className={fieldWithBoarderClass}
              agreementHistory={agreementHistory}
              handleAddComment={handleAddComment}
            />
          </div>
        )}

        <div className="mt-4">
          <p className={fieldLabelClass}>Supporting Documents</p>
          <div className={fieldWithBoarderClass}>
            <AttachmentsList
              className="mb-3"
              attachments={agreementAttachment}
            />
            {agreementAttachment.length > 0 && (
              <AttachmentsDownload
                download={() =>
                  getAgreementAttachmentDownloadUrls(agreementAttachment)
                }
                zipName={`agreement_${agreement.id}_attachments.zip`}
              />
            )}
          </div>
        </div>

        <div className="flex flex-row gap-12 my-4">
          <a
            className={`${buttonStyle} ${secondaryButtonClass}`}
            href={backLink}
          >
            Back
          </a>
          {editLink && (
            <a
              className={`${buttonStyle} ${secondaryButtonClass}`}
              href={editLink}
            >
              Edit
            </a>
          )}
          {handleRecommendApproval && ready && (
            <Button
              className={buttonStyle}
              onClick={() => {
                setIsProcessing(true);
                handleRecommendApproval();
              }}
            >
              Submit to Director
            </Button>
          )}
          {handleReturnToAnalyst && (
            <Button
              className={`${buttonStyle} ${warningButtonClass}`}
              onClick={() => {
                setIsProcessing(true);
                handleReturnToAnalyst();
              }}
            >
              Return to Analyst
            </Button>
          )}
          {handleDeleteAgreement && (
            <Button
              className={`${buttonStyle} ${warningButtonClass}`}
              onClick={() => {
                setIsProcessing(true);
                handleDeleteAgreement();
              }}
            >
              Delete
            </Button>
          )}
          {handleIssueAgreement && (
            <Button
              className={buttonStyle}
              onClick={() => {
                setIsProcessing(true);
                handleIssueAgreement();
              }}
            >
              Issue Agreement
            </Button>
          )}
        </div>
      </div>
    </>
  );
};
