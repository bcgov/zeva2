import { prisma } from "@/lib/prisma";
import { prismaOld } from "@/lib/prismaOld";
import { ModelYear, ZevClass } from "./generated/client";
import { getStringsToModelYearsEnumsMap } from "@/app/lib/utils/enumMaps";
import { Notification } from "./generated/client";
import { isNotification } from "@/app/lib/utils/typeGuards";
import { seedOrganizations } from "./seedProcesses/seedOrganizations";
import { seedTransactions } from "./seedProcesses/seedTransactions";
import { seedIcbc } from "./seedProcesses/seedIcbc";
import { seedUsers } from "./seedProcesses/seedUsers";
import { seedVolumes } from "./seedProcesses/seedVolumes";
import { seedVehicles } from "./seedProcesses/seedVehicles";
import { seedLegacyAssessedMyrs } from "./seedProcesses/seedLegacyAssessedMyrs";
import { seedEndingBalances } from "./seedProcesses/seedEndingBalances";
import { seedLegacyVins } from "./seedProcesses/seedLegacyVins";
import { seedComplianceRatios } from "./seedProcesses/seedComplianceRatios";

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
      const { mapOfOldOrgIdsToNewOrgIds } = await seedOrganizations(
        tx,
        mapOfModelYearIdsToModelYearEnum,
      );

      // seed compliance ratios
      await seedComplianceRatios(tx);

      // seed user tables
      const mapOfOldUserIdsToNewUserIds = await seedUsers(
        tx,
        mapOfOldOrgIdsToNewOrgIds,
      );

      // add notifications from old subscription table
      const notificationsOld = await prismaOld.notification.findMany({
        select: { id: true, notification_code: true },
      });

      const notifCodeById = notificationsOld.reduce<Record<number, string>>(
        (acc, n) => {
          acc[n.id] = n.notification_code;
          return acc;
        },
        {},
      );

      const subsOld = await prismaOld.notification_subscription.findMany({
        select: { user_profile_id: true, notification_id: true },
      });

      const grouped = subsOld.reduce<Record<number, string[]>>((acc, sub) => {
        const code = notifCodeById[sub.notification_id];
        if (!code) return acc;
        acc[sub.user_profile_id] ??= [];
        acc[sub.user_profile_id].push(code);
        return acc;
      }, {});

      for (const [oldUserId, codes] of Object.entries(grouped)) {
        const newUserId = mapOfOldUserIdsToNewUserIds[Number(oldUserId)];
        if (!newUserId) continue;

        const validNotifications = codes
          .map((code) => code as Notification)
          .filter((n) => isNotification(n));

        await tx.user.update({
          where: { id: newUserId },
          data: { notifications: { set: validNotifications } },
        });
      }

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

      await seedLegacyVins(tx);

      await seedIcbc(tx, mapOfModelYearIdsToModelYearEnum);

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
