import { TransactionClient } from "@/types/prisma";
import { IcbcFileStatus, IcbcRecord, ModelYear } from "../generated/client";
import { prismaOld } from "@/lib/prismaOld";
import { randomUUID } from "crypto";
import { getIsoYmdString, validateDate } from "@/app/lib/utils/date";

export const seedIcbc = async (
  tx: TransactionClient,
  mapOfModelYearIdsToModelYearEnum: Partial<Record<number, ModelYear>>,
) => {
  const mapOfOldFileIdsToNewFileIds: Partial<Record<number, number>> = {};
  const icbcFilesOld = await prismaOld.icbc_upload_date.findMany();
  icbcFilesOld.forEach(async (fileOld) => {
    let name = fileOld.filename;
    if (!name) {
      name = `seedGen-${randomUUID()}`;
    }
    const oldTs = fileOld.upload_date;
    oldTs.setDate(oldTs.getDate() + 1);
    const newDateString = getIsoYmdString(oldTs);
    const [dateIsValid, newTs] = validateDate(newDateString);
    if (!dateIsValid) {
      throw new Error(
        "Error parsing the upload date of the icbc file  with id " + fileOld.id,
      );
    }
    const newFile = await tx.icbcFile.create({
      data: {
        name,
        isLegacy: true,
        status: IcbcFileStatus.SUCCESS,
        timestamp: newTs,
      },
    });
    mapOfOldFileIdsToNewFileIds[fileOld.id] = newFile.id;
  });

  const take = 100000;
  const numberOfRecords = await prismaOld.icbc_registration_data.count();
  const iterations = Math.floor(numberOfRecords / take) + 1;
  for (let i = 0; i < iterations; i++) {
    const skip = i * take;
    const recordsOld = await prismaOld.icbc_registration_data.findMany({
      take,
      skip,
      include: {
        icbc_vehicle: true,
      },
    });
    const toCreate: Omit<IcbcRecord, "id">[] = [];
    recordsOld.forEach((recordOld) => {
      const modelYear =
        mapOfModelYearIdsToModelYearEnum[recordOld.icbc_vehicle.model_year_id];
      if (!modelYear) {
        throw new Error(
          "ICBC record with id " + recordOld.id + " has an unknown model year!",
        );
      }
      const icbcFileId =
        mapOfOldFileIdsToNewFileIds[recordOld.icbc_upload_date_id];
      if (!icbcFileId) {
        throw new Error(
          "ICBC record with id " +
            recordOld.id +
            " has an unknown ICBC file associated with it!",
        );
      }
      toCreate.push({
        vin: recordOld.vin,
        icbcFileId,
        make: recordOld.icbc_vehicle.make,
        model: recordOld.icbc_vehicle.model_name,
        year: modelYear,
      });
    });
    await tx.icbcRecord.createMany({
      data: toCreate,
    });
  }
};
