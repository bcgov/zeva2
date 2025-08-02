"use client";

import {
  AgreementStatus,
  AgreementType,
  ModelYear,
  ZevClass
} from "@/prisma/generated/client";
import { useState } from "react";
import { AgreementContentPayload, AgreementPayload } from "../action";
import { cleanupStringData } from "@/lib/utils/dataCleanup";
import { AgreementDetailsType } from "../services";

const mainDivClass = "grid grid-cols-[220px_1fr]";
const fieldLabelClass = "py-1 font-semibold text-primaryBlue";
const fieldContentClass = "p-1 border border-gray-300 rounded";

export const AgreementEditForm = (props: {
  supplierSelections: { id: number; name: string }[];
  modelYearSelections: ModelYear[];
  zevClassSelections: ZevClass[];
  agreementDetails?: AgreementDetailsType;
  upsertAgreement: (data: AgreementPayload) => Promise<void>;
  handleCancel: () => void;
}) => {
  const {
    supplierSelections,
    modelYearSelections,
    zevClassSelections,
    agreementDetails,
    upsertAgreement,
    handleCancel,
  } = props;

  const newContent = {
    zevClass: zevClassSelections[0],
    modelYear: modelYearSelections[modelYearSelections.length - 1],
    numberOfUnits: 0,
  }

  const [agreementType, setAgreementType] = useState<AgreementType | undefined>(
    agreementDetails?.agreementType
  );
  const [supplier, setSupplier] = useState<number | undefined>(
    agreementDetails?.organization.id
  );
  const [referenceId, setReferenceId] = useState<string>(
    agreementDetails?.referenceId ?? ""
  );
  const [effectiveDate, setEffectiveDate] = useState<Date | undefined>(
    agreementDetails?.effectiveDate ?? undefined
  );
  const [msgToSupplier, setMsgToSupplier] = useState<string>(
    agreementDetails?.comment ?? ""
  );
  const [agreementContent, setAgreementContent] = useState<AgreementContentPayload[]>(
    agreementDetails?.agreementContent ?? [{ ...newContent }]
  );
  const [errorMsg, setErrorMsg] = useState<string | undefined>(undefined);
  const [processingMsg, setProcessingMsg] = useState<string | undefined>(undefined);

  const handleSave = async () => {
    if (!supplier || !agreementType) {
      setErrorMsg("Both the Agreement Type and the Vehicle Supplier are required.");
      return;
    }
    setProcessingMsg("Saving...");
    await upsertAgreement({
      referenceId: cleanupStringData(referenceId),
      organizationId: supplier,
      agreementType: agreementType,
      status: AgreementStatus.DRAFT,
      effectiveDate: effectiveDate ?? null,
      comment: cleanupStringData(msgToSupplier),
      agreementContent: agreementContent,
    });
  };

  if (processingMsg) {
    return <p className="p-4 text-primaryBlue">{processingMsg}</p>;
  }

  return (
    <form className="space-y-4 mb-10">
      {errorMsg && <p className="text-red-600">{errorMsg}</p>}

      <div className={mainDivClass}>
        <span className={fieldLabelClass}>Agreement Type</span>
        <select
          name="agreementType"
          className={fieldContentClass + " w-60"}
          value={agreementType}
          required
          onChange={(e) => {
            setAgreementType(e.target.value as AgreementType | undefined);
            setErrorMsg(undefined); // Clear error message when agreement type changes
          }}
        >
          {!agreementType && <option value={undefined}></option>}
          {Object.values(AgreementType).map((agreementType) => (
            <option key={agreementType} value={agreementType}>
              {agreementType}
            </option>
          ))}
        </select>
      </div>

      <div className={mainDivClass}>
        <span className={fieldLabelClass}>Vehicle Supplier</span>
        <select
          name="supplier"
          className={fieldContentClass + " w-60"}
          value={supplier}
          onChange={(e) => {
            setSupplier(e.target.value ? parseInt(e.target.value, 10) : undefined);
            setErrorMsg(undefined); // Clear error message when supplier changes
          }}
        >
          {!supplier && <option value={undefined}></option>}
          {Object.values(supplierSelections).map((supplier) => (
            <option key={supplier.id} value={supplier.id}>
              {supplier.name}
            </option>
          ))}
        </select>
      </div>

      <div className={mainDivClass}>
        <span className={fieldLabelClass}>Reference ID (optional)</span>
        <input
          className={fieldContentClass + " w-60"}
          type="text"
          value={referenceId}
          placeholder="Optional reference ID"
          onChange={(e) => setReferenceId(e.target.value)}
        />
      </div>

      <div className={mainDivClass}>
        <span className={fieldLabelClass}>Effective Date</span>
        <input
          className={fieldContentClass + " w-60"}
          type="date"
          value={effectiveDate ? effectiveDate.toISOString().split("T")[0] : ""}
          placeholder="YYYY-MM-DD"
          onChange={(e) => {
            const date = e.target.value ? new Date(e.target.value) : undefined;
            setEffectiveDate(date);
          }}
        />
      </div>

      <div className="p-2 border border-gray-300 rounded">
        <p className={fieldLabelClass}>ZEV Units</p>
        {agreementContent.map((content, index) => (
          <div
            key={index}
            className="p-2 border-b border-gray-300 grid grid-cols-[140px_220px_250px_80px]"
          >
            <div className="grid grid-cols-[50px_50px]">
              <span className="py-1">Class</span>
              <select
                name="zevClass"
                className={fieldContentClass}
                value={content.zevClass}
                onChange={(e) => {
                  const newZevValues = [...agreementContent];
                  newZevValues[index].zevClass = e.target.value as ZevClass;
                  setAgreementContent(newZevValues);
                }}
              >
                {zevClassSelections.map((zevClass) => (
                  <option key={zevClass} value={zevClass}>
                    {zevClass}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-[100px_80px]">
              <span className="py-1">Model Year</span>
              <select
                value={content.modelYear}
                onChange={(e) => {
                  const newZevValues = [...agreementContent];
                  newZevValues[index].modelYear = e.target.value as ModelYear;
                  setAgreementContent(newZevValues);
                }}
              >
                {Object.values(modelYearSelections).map((modelYear) => (
                  <option key={modelYear} value={modelYear}>
                    {modelYear.substring(3)}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-[150px_80px]">
              <span className="py-1">Number of Units</span>
              <input
                className={fieldContentClass + " text-right"}
                type="number"
                value={content.numberOfUnits.toString()}
                onChange={(e) => {
                  const newZevValues = [...agreementContent];
                  newZevValues[index].numberOfUnits = parseInt(e.target.value, 10);
                  setAgreementContent(newZevValues);
                }}
              />
            </div>

            <button
              type="button"
              className="bg-transparent text-primaryBlue
                text-sm border border-gray-300 rounded"
              onClick={() => {
                const newAgreementContent = [...agreementContent];
                newAgreementContent.splice(index, 1);
                setAgreementContent(newAgreementContent);
              }}
            >
              Remove
            </button>
          </div>
        ))}

        <button
          type="button"
          className="mt-2 bg-transparent text-primaryBlue
            px-4 py-2 border border-gray-300 rounded"
          onClick={() => setAgreementContent([...agreementContent, { ...newContent }])}
        >
          + Add Additional Line
        </button>
      </div>

      <div>
        <p>Message to Supplier</p>
        <textarea
          className={fieldContentClass + " w-full"}
          rows={4}
          value={msgToSupplier}
          placeholder="Optional message to the supplier regarding this agreement."
          onChange={(e) => setMsgToSupplier(e.target.value)}
        />
      </div>

      <div>
        <button
          type="button"
          className="bg-primaryBlue text-white px-4 py-2 rounded"
          onClick={handleSave}
        >
          Save
        </button>
        <button
          type="button"
          className="bg-white text-primaryBlue px-4 py-2 rounded ml-2
            border border-primaryBlue"
          onClick={() => {
            setProcessingMsg("Cancel...");
            handleCancel();
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
