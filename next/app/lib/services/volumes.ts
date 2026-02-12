import { prisma } from "@/lib/prisma";
import {
  ModelYear,
  SupplyVolume,
  VehicleClass,
} from "@/prisma/generated/client";

export const getPrevSupplierVolumes = async (
  vehicleClass: VehicleClass,
  complianceYear: ModelYear,
  organizationId?: number,
) => {
  const modelYearsArray = Object.values(ModelYear);
  const myIndex = modelYearsArray.findIndex((my) => my === complianceYear);
  const precedingMys: ModelYear[] = [];
  for (let i = 1; i <= 3; i++) {
    const precedingMy = modelYearsArray[myIndex - i];
    if (precedingMy) {
      precedingMys.push(precedingMy);
    }
  }
  if (precedingMys.length !== 3) {
    throw new Error("Error getting supplier class!");
  }
  const whereClause = {
    OR: [
      { modelYear: precedingMys[0] },
      { modelYear: precedingMys[1] },
      { modelYear: precedingMys[2] },
    ],
    vehicleClass,
    volume: { gt: 0 },
    organizationId,
  };
  const orderBy: { modelYear: "asc" | "desc" } = {
    modelYear: "desc",
  };
  let volumes: SupplyVolume[] = [];
  if (complianceYear < ModelYear.MY_2024) {
    volumes = await prisma.legacySalesVolume.findMany({
      where: whereClause,
      orderBy,
    });
  } else {
    volumes = await prisma.supplyVolume.findMany({
      where: whereClause,
      orderBy,
    });
  }
  return {
    precedingMys,
    volumes,
  };
};
