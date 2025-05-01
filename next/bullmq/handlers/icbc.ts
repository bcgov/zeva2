import { Job } from "bullmq";
import { prisma } from "@/lib/prisma";
import { getObject } from "@/app/lib/minio";
import { IcbcFileStatus, IcbcRecord } from "@/prisma/generated/client";
import { parse } from "fast-csv";

type Row = { [key: string]: string };

export const handleConsumeIcbcFileJob = async (job: Job) => {
  const jobData = job.data;
  const icbcFileId: number = jobData.icbcFileId;
  const icbcFile = await prisma.icbcFile.findUniqueOrThrow({
    where: {
      id: icbcFileId,
    },
  });
  const fileName = icbcFile.name;
  const fileStream = await getObject(fileName);
  const csvStream = fileStream.pipe(parse({ headers: true, delimiter: "|" }));
  let rows: Row[] = [];
  for await (const row of csvStream) {
    if (shouldInclude(row)) {
      rows.push(row);
    }
    if (rows.length === 10000) {
      await processRows(rows, icbcFileId);
      rows = [];
    }
  }
  // process end rows, if any
  if (rows.length > 0) {
    await processRows(rows, icbcFileId);
  }
  // delete any records not associated with the file in question (not sure if we should do this; seek confirmation)
  await prisma.icbcRecord.deleteMany({
    where: {
      icbcFileId: {
        not: icbcFileId,
      },
    },
  });
};

const shouldInclude = (row: Row) => {
  const modelYear = row["model_year"];
  const hybridFlag = row["hybrid_vehicle_flag"];
  const evFlag = row["electric_vehicle_flag"];
  const fuelType = row["fuel_type"];
  if (modelYear) {
    const modelYearInt = parseInt(modelYear, 10);
    if (
      modelYearInt > 2018 &&
      (hybridFlag === "Y" ||
        evFlag === "Y" ||
        fuelType === "ELECTRIC" ||
        fuelType === "HYDROGEN" ||
        fuelType === "GASOLINEELECTRIC")
    ) {
      return true;
    }
  }
  return false;
};

type MapOfVinsToData = {
  [key: string]: { make: string; model: string; year: string };
};

const processRows = async (rows: Row[], icbcFileId: number) => {
  const mapOfVinsToData: MapOfVinsToData = {};
  for (const row of rows) {
    const vin = row["vin"];
    const make = row["make"];
    const model = row["model"];
    const year = row["model_year"];
    if (vin && make && model && year) {
      mapOfVinsToData[vin] = {
        make,
        model,
        year,
      };
    }
  }
  await deleteAndCreate(mapOfVinsToData, icbcFileId);
};

// prisma doesn't have bulk upsert; will have to bulk delete, then bulk create
const deleteAndCreate = async (map: MapOfVinsToData, icbcFileId: number) => {
  const vins = Object.keys(map);
  const toCreate: Omit<IcbcRecord, "id">[] = [];
  for (const [vin, data] of Object.entries(map)) {
    toCreate.push({
      vin,
      make: data.make,
      model: data.model,
      year: data.year,
      icbcFileId,
    });
  }
  await prisma.$transaction([
    prisma.icbcRecord.deleteMany({
      where: {
        vin: {
          in: vins,
        },
      },
    }),
    prisma.icbcRecord.createMany({
      data: toCreate,
    }),
  ]);
};

export const handleConsumeIcbcFileJobCompleted = async (job: Job) => {
  const jobData = job.data;
  const icbcFileId: number = jobData.icbcFileId;
  await prisma.icbcFile.update({
    where: {
      id: icbcFileId,
    },
    data: {
      status: IcbcFileStatus.SUCCESS,
    },
  });
};

export const handleConsumeIcbcFileJobFailed = async (
  job: Job | undefined,
  error: Error,
) => {
  console.error(error);
  if (job) {
    const jobData = job.data;
    const icbcFileId: number = jobData.icbcFileId;
    await prisma.icbcFile.update({
      where: {
        id: icbcFileId,
      },
      data: {
        status: IcbcFileStatus.FAILURE,
      },
    });
  }
};
