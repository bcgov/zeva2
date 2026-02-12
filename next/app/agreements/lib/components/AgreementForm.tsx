"use client";

import axios from "axios";
import {
  useState,
  useCallback,
  useTransition,
  useMemo,
  useEffect,
  JSX,
} from "react";
import { useRouter } from "next/navigation";
import {
  createAgreement,
  getVehicleAttachmentsPutData,
  saveAgreement,
} from "../actions";
import { Routes } from "@/app/lib/constants";
import {
  AgreementType,
  ModelYear,
  VehicleClass,
  ZevClass,
} from "@/prisma/generated/client";
import { getStringsToAgreementTypeEnumsMap } from "@/app/lib/utils/enumMaps";
import { Dropzone } from "@/app/lib/components/Dropzone";
import { FileWithPath } from "react-dropzone";
import { Button } from "@/app/lib/components";
import { Attachment, AttachmentDownload } from "@/app/lib/services/attachments";
import { getFiles } from "@/app/lib/utils/download";
import { AgreementContent } from "./AgreementContent";
import { validateDate } from "@/app/lib/utils/date";
import { validateNumberOfUnits } from "../utilsClient";

const mainDivClass = "grid grid-cols-[220px_1fr]";
const fieldLabelClass = "py-1 font-semibold text-primaryBlue";
const fieldContentClass = "p-1 border border-gray-300 rounded";

type NewProps = {
  type: "new";
  orgsMap: Partial<Record<number, string>>;
};

type SavedProps = {
  type: "saved";
  orgsMap: Partial<Record<number, string>>;
  agreementId: number;
  orgId: number;
  agreementType: AgreementType;
  date: string;
  content: {
    vehicleClass: VehicleClass;
    zevClass: ZevClass;
    modelYear: ModelYear;
    numberOfUnits: string;
  }[];
  attachments: AttachmentDownload[];
};

export const AgreementForm = (props: NewProps | SavedProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>("");
  const [orgId, setOrgId] = useState<number>();
  const [agreementId, setAgreementId] = useState<number>();
  const [agreementType, setAgreementType] = useState<AgreementType>();
  const [date, setDate] = useState<string>();
  const [content, setContent] = useState<SavedProps["content"]>([]);
  const [orgsMap, setOrgsMap] = useState<Partial<Record<number, string>>>();
  const [files, setFiles] = useState<FileWithPath[]>([]);

  const typesMap = useMemo(() => {
    return getStringsToAgreementTypeEnumsMap();
  }, []);

  useEffect(() => {
    setOrgsMap(props.orgsMap);
    if (props.type === "saved") {
      setAgreementId(props.agreementId);
      setOrgId(props.orgId);
      setAgreementType(props.agreementType);
      setDate(props.date);
      setContent(props.content);
      const initializeForm = async () => {
        const attachments = props.attachments;
        if (attachments.length > 0) {
          const downloadedFiles = await getFiles(attachments);
          const filesToSet = downloadedFiles.map((file) => {
            return new File([file.data], file.fileName);
          });
          setFiles(filesToSet);
        }
      };
      initializeForm();
    }
  }, []);

  const handleOrgSelect = useCallback(
    (selectedOrgId: string) => {
      if (props.type === "new" && orgsMap) {
        const orgIdNumber = Number.parseInt(selectedOrgId, 10);
        if (orgsMap[orgIdNumber]) {
          setOrgId(orgIdNumber);
        } else {
          setOrgId(undefined);
        }
      }
    },
    [props.type, orgsMap],
  );

  const handleChange = useCallback(
    (key: "agreementType" | "date", value: string) => {
      if (key === "agreementType" && props.type === "new") {
        setAgreementType(typesMap[value]);
      } else if (key === "date") {
        setDate(value);
      }
    },
    [props.type, typesMap],
  );

  const handleSubmit = useCallback(() => {
    setError("");
    startTransition(async () => {
      try {
        if (!orgId || !agreementType || !date) {
          throw new Error(
            "Supplier, Agreement Type, and Date fields required!",
          );
        }
        const [dateIsValid] = validateDate(date);
        if (!dateIsValid) {
          throw new Error("Date must be of the YYYY-MM-DD format!");
        }
        if (content.length === 0) {
          throw new Error("");
        }
        for (const record of content) {
          validateNumberOfUnits(record.numberOfUnits);
        }
        const attachments: Attachment[] = [];
        if (files.length > 0) {
          const putDataResponse = await getVehicleAttachmentsPutData(
            files.length,
            orgId,
          );
          if (putDataResponse.responseType === "error") {
            throw new Error(putDataResponse.message);
          }
          for (const [index, file] of files.entries()) {
            const putDatum = putDataResponse.data[index];
            await axios.put(putDatum.url, file);
            attachments.push({
              fileName: file.name,
              objectName: putDatum.objectName,
            });
          }
        }
        let response;
        if (props.type === "new") {
          response = await createAgreement(
            orgId,
            agreementType,
            date,
            content,
            attachments,
          );
        } else if (props.type === "saved" && agreementId) {
          response = await saveAgreement(
            agreementId,
            date,
            content,
            attachments,
          );
        }
        if (response && response.responseType === "error") {
          throw new Error(response.message);
        } else if (response && response.responseType === "data") {
          const agreementId = response.data;
          router.push(`${Routes.CreditAgreements}/${agreementId}`);
        }
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        }
      }
    });
  }, [props.type, files, agreementId, orgId, agreementType, date, content]);

  const orgsComponent: JSX.Element | null = useMemo(() => {
    if (orgsMap) {
      return (
        <div className={mainDivClass}>
          <span className={fieldLabelClass}>Supplier</span>
          <select
            name="supplier"
            className={fieldContentClass + " w-60"}
            value={orgId}
            onChange={(e) => handleOrgSelect(e.target.value)}
            disabled={props.type === "saved" || isPending}
          >
            <option value={undefined}></option>
            {Object.entries(orgsMap).map(([key, value]) => (
              <option key={key} value={key}>
                {value}
              </option>
            ))}
          </select>
        </div>
      );
    }
    return null;
  }, [props.type, orgId, orgsMap]);

  return (
    <div className="space-y-4 mb-10">
      {orgsComponent}
      <div className={mainDivClass}>
        <span className={fieldLabelClass}>Agreement Type</span>
        <select
          name="agreementType"
          className={fieldContentClass + " w-60"}
          value={agreementType}
          required
          onChange={(e) => handleChange("agreementType", e.target.value)}
          disabled={props.type === "saved" || isPending}
        >
          <option value={undefined}>--</option>
          {Object.entries(typesMap).map(([key, value]) => (
            <option key={key} value={value}>
              {key}
            </option>
          ))}
        </select>
      </div>
      <div className={mainDivClass}>
        <span className={fieldLabelClass}>Effective Date</span>
        <input
          className={fieldContentClass + " w-60"}
          type="date"
          value={date}
          placeholder="YYYY-MM-DD"
          onChange={(e) => handleChange("date", e.target.value)}
          disabled={isPending}
        />
      </div>
      <AgreementContent
        content={content}
        setContent={setContent}
        disabled={isPending}
      />
      <div>
        <p className={fieldLabelClass}>Supporting Documents</p>
        <Dropzone
          files={files}
          setFiles={setFiles}
          disabled={isPending}
          maxNumberOfFiles={10}
        />
      </div>
      {error && <p className="text-red-600">{error}</p>}
      <div>
        <Button variant="primary" disabled={isPending} onClick={handleSubmit}>
          Save
        </Button>
      </div>
    </div>
  );
};
