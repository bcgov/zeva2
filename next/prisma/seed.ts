import { prisma } from "@/lib/prisma";
import { prismaOld } from "@/lib/prismaOld";
import { ModelYear, ZevClass } from "./generated/enums";
import { getStringsToModelYearsEnumsMap } from "@/app/lib/utils/enumMaps";
import { seedOrganizations } from "./seedProcesses/seedOrganizations";
import { seedTransactions } from "./seedProcesses/seedTransactions";
import { seedUsers } from "./seedProcesses/seedUsers";
import { seedVolumes } from "./seedProcesses/seedVolumes";
import { seedVehicles } from "./seedProcesses/seedVehicles";
import { seedLegacyAssessedMyrs } from "./seedProcesses/seedLegacyAssessedMyrs";
import { seedEndingBalances } from "./seedProcesses/seedEndingBalances";
import { seedReservedVins } from "./seedProcesses/seedReservedVins";
import { seedLegacyVinRecords } from "./seedProcesses/seedLegacyVinRecords";

// prismaOld to interact with old zeva db; prisma to interact with new zeva db
const main = () => {
  const modelYearsMap = getStringsToModelYearsEnumsMap();
  return prisma.$transaction(
    async (tx) => {
      const mapOfModelYearIdsToModelYearEnum: Partial<
        Record<number, ModelYear>
      > = {};
      const mapOfOldCreditClassIdsToZevClasses: Partial<
        Record<number, ZevClass>
      > = {};

      const modelYearsOld = await prismaOld.model_year.findMany();
      for (const modelYearOld of modelYearsOld) {
        mapOfModelYearIdsToModelYearEnum[modelYearOld.id] =
          modelYearsMap[modelYearOld.description];
      }

      const creditClassesOld = await prismaOld.credit_class_code.findMany();
      for (const creditClass of creditClassesOld) {
        mapOfOldCreditClassIdsToZevClasses[creditClass.id] =
          ZevClass[creditClass.credit_class as keyof typeof ZevClass];
      }

      // seed organization tables
      const mapOfOldOrgIdsToNewOrgIds = await seedOrganizations(tx);

      // seed user tables
      await seedUsers(tx, mapOfOldOrgIdsToNewOrgIds);

      await seedTransactions(
        tx,
        mapOfOldCreditClassIdsToZevClasses,
        mapOfModelYearIdsToModelYearEnum,
        mapOfOldOrgIdsToNewOrgIds,
      );

      await seedEndingBalances(
        tx,
        mapOfModelYearIdsToModelYearEnum,
        mapOfOldOrgIdsToNewOrgIds,
      );

      await seedVehicles(
        tx,
        mapOfModelYearIdsToModelYearEnum,
        mapOfOldOrgIdsToNewOrgIds,
        mapOfOldCreditClassIdsToZevClasses,
      );

      await seedReservedVins(tx);

      await seedVolumes(
        tx,
        mapOfModelYearIdsToModelYearEnum,
        mapOfOldOrgIdsToNewOrgIds,
      );

      await seedLegacyAssessedMyrs(
        tx,
        mapOfModelYearIdsToModelYearEnum,
        mapOfOldOrgIdsToNewOrgIds,
      );

      await seedLegacyVinRecords(
        tx,
        mapOfModelYearIdsToModelYearEnum,
        mapOfOldOrgIdsToNewOrgIds,
      );
    },
    {
      timeout: 10000,
    },
  );
};

main()
  .then(async () => {
    console.log("seed successful");
    await prisma.$disconnect();
    await prismaOld.$disconnect();
  })
  .catch(async (e) => {
    console.log(e);
    await prisma.$disconnect();
    await prismaOld.$disconnect();
    process.exit(1);
  });
