import Excel from "exceljs";
import axios, { AxiosResponse } from "axios";
import {
  CaDataFinal,
  ZevModelsMap,
  zevsListSheetName,
  zevsListSheetNumberOfRows,
  ZevVinRecord,
  ZevVinRecordSparse,
} from "./constants";
import { getStringsToModelYearsEnumsMap } from "@/app/lib/utils/enumMaps";
import { validateDate } from "@/app/lib/utils/date";
import { getZevModelKey } from "@/app/zev-models/lib/utils";
import {
  getCreditApplicationAttachmentPutData,
  getCreditApplicationPutData,
} from "./actions";
import { Attachment } from "@/app/lib/constants/attachment";

export const getCaData = async (
  caFile: File,
  eligibleVehiclesMap: ZevModelsMap,
) => {
  const result: {
    seenVins: Set<string>;
    duplicateVins: Set<string>;
    records: Partial<ZevVinRecord>[];
  } = {
    seenVins: new Set<string>(),
    duplicateVins: new Set<string>(),
    records: [],
  };
  const caBuf = await caFile.arrayBuffer();
  const caWorkbook = new Excel.Workbook();
  await caWorkbook.xlsx.load(caBuf);
  const caZevsSheet = caWorkbook.getWorksheet(zevsListSheetName);
  if (!caZevsSheet) {
    throw new Error("Expected sheet not found!");
  }
  const modelYearsMap = getStringsToModelYearsEnumsMap();
  for (let i = 2; i <= zevsListSheetNumberOfRows; i++) {
    const row = caZevsSheet.getRow(i);
    const make = row.getCell(1).value?.toString();
    const modelName = row.getCell(2).value?.toString();
    const modelYear = row.getCell(3).value?.toString().trim();
    const vin = row.getCell(4).value?.toString().trim().toUpperCase();
    const date = row.getCell(5).value?.toString();
    if (!make && !modelName && !modelYear && !vin && !date) {
      continue;
    }
    const record: Partial<ZevVinRecord> = {
      make,
      modelName,
      modelYear,
      vin,
      date,
    };
    const errors: string[] = [];
    if (!make || !modelName || !modelYear || !vin || !date) {
      errors.push("Missing data");
    }
    if (modelYear && !modelYearsMap[modelYear]) {
      errors.push("Invalid Model Year!");
    }
    if (vin && vin.length !== 17) {
      errors.push("VIN must be exactly 17 characters!");
    }
    if (vin && vin.length === 17) {
      if (result.seenVins.has(vin)) {
        result.duplicateVins.add(vin);
      } else {
        result.seenVins.add(vin);
      }
    }
    if (date) {
      const [dateIsValid] = validateDate(date);
      if (dateIsValid) {
        // lexicographic comparison
        if (date < "2018-01-02") {
          errors.push("Date must be on or after 2018-01-02");
        }
      } else {
        errors.push("Invalid Date Format");
      }
    }
    if (make && modelName && modelYear) {
      const myEnum = modelYearsMap[modelYear];
      if (myEnum) {
        const zevModelKey = getZevModelKey(make, modelName, myEnum);
        const associatedVehicle = eligibleVehiclesMap[zevModelKey];
        if (!associatedVehicle) {
          errors.push("No System ZEV can be associated with this record");
        } else {
          record.vehicleClass = associatedVehicle.vehicleClass;
          record.zevClass = associatedVehicle.zevClass;
          record.zevType = associatedVehicle.zevType;
          record.legacyNumberOfUnits = associatedVehicle.legacyNumberOfUnits;
          record.numberOfUnits = associatedVehicle.numberOfUnits;
          record.range = associatedVehicle.range;
        }
      }
    }
    record.errors = errors;
    result.records.push(record);
  }

  return result;
};

export const refineCaRecords = (
  records: Partial<ZevVinRecord>[],
  duplicateVins: Set<string>,
  reservedVins: Set<string>,
) => {
  for (const record of records) {
    const vin = record.vin;
    const errors = record.errors;
    if (vin && errors) {
      if (duplicateVins.has(vin)) {
        errors.push("Duplicate VIN");
      }
      if (reservedVins.has(vin)) {
        errors.push("Reserved VIN");
      }
    }
  }
};

export const getCaDataFinal = async (
  records: Partial<ZevVinRecordSparse>[],
  caSubTemplateUrl: string,
): Promise<CaDataFinal> => {
  const eligibleRecords: Partial<ZevVinRecord>[] = [];
  const eligibleWorkbook = new Excel.Workbook();
  const ineligibleRecords: Partial<ZevVinRecord>[] = [];
  const ineligibleWorkbook = new Excel.Workbook();
  const urlResponse = await axios.get(caSubTemplateUrl, {
    responseType: "arraybuffer",
  });
  const caSubTemplate = urlResponse.data;
  await Promise.all([
    eligibleWorkbook.xlsx.load(caSubTemplate),
    ineligibleWorkbook.xlsx.load(caSubTemplate),
  ]);
  const eligibleRecordsZevsSheet =
    eligibleWorkbook.getWorksheet(zevsListSheetName);
  const ineligibleRecordsZevsSheet =
    ineligibleWorkbook.getWorksheet(zevsListSheetName);
  if (!eligibleRecordsZevsSheet || !ineligibleRecordsZevsSheet) {
    throw new Error("Expected sheet not found!");
  }
  for (const record of records) {
    if (record.errors && record.errors.length > 0) {
      ineligibleRecords.push(record);
    } else {
      eligibleRecords.push(record);
    }
  }
  if (eligibleRecords.length > 0 && ineligibleRecords.length > 0) {
    writeEligibleRecords(eligibleRecords, eligibleRecordsZevsSheet);
    writeIneligibleRecords(ineligibleRecords, ineligibleRecordsZevsSheet);
    return {
      type: "eligibleIneligible",
      eligibleWorkbook,
      eligibleCount: eligibleRecords.length,
      ineligibleWorkbook,
      ineligibleCount: ineligibleRecords.length,
    };
  } else if (eligibleRecords.length > 0 && ineligibleRecords.length === 0) {
    return {
      type: "eligible",
      payload: eligibleRecords,
    };
  } else if (eligibleRecords.length === 0 && ineligibleRecords.length > 0) {
    writeIneligibleRecords(ineligibleRecords, ineligibleRecordsZevsSheet);
    return {
      type: "ineligible",
      ineligibleWorkbook,
      ineligibleCount: ineligibleRecords.length,
    };
  } else {
    return {
      type: "none",
    };
  }
};

const writeEligibleRecords = (
  records: Partial<ZevVinRecord>[],
  sheet: Excel.Worksheet,
) => {
  for (const [index, record] of records.entries()) {
    const row = sheet.getRow(index + 2);
    row.getCell(1).value = record.make ?? "";
    row.getCell(2).value = record.modelName ?? "";
    row.getCell(3).value = record.modelYear ?? "";
    row.getCell(4).value = record.vin ?? "";
    row.getCell(5).value = record.date ?? "";
  }
};

const writeIneligibleRecords = (
  records: Partial<ZevVinRecord>[],
  sheet: Excel.Worksheet,
) => {
  for (const [index, record] of records.entries()) {
    const row = sheet.getRow(index + 2);
    row.getCell(1).value = record.make ?? "";
    row.getCell(2).value = record.modelName ?? "";
    row.getCell(3).value = record.modelYear ?? "";
    row.getCell(4).value = record.vin ?? "";
    row.getCell(5).value = record.date ?? "";
    row.getCell(6).value = record.errors ? record.errors.join("; ") : "";
  }
};

export const uploadFiles = async (caFile: File, attachments: File[]) => {
  const [applicationPutData, attachmentsPutData] = await Promise.all([
    getCreditApplicationPutData(),
    getCreditApplicationAttachmentPutData(attachments.length),
  ]);
  const puts: Promise<AxiosResponse>[] = [];
  puts.push(
    axios.put(applicationPutData.url, caFile, {
      headers: { "if-none-match": "*" },
    }),
  );
  const attachmentsPayload: Attachment[] = [];
  for (const [index, attachment] of attachments.entries()) {
    const putDatum = attachmentsPutData[index];
    puts.push(
      axios.put(putDatum.url, attachment, {
        headers: { "if-none-match": "*" },
      }),
    );
    attachmentsPayload.push({
      objectName: putDatum.objectName,
      fileName: attachment.name,
    });
  }
  await Promise.all(puts);
  return {
    caObjectName: applicationPutData.objectName,
    caFileName: caFile.name,
    attachmentsPayload,
  };
};
