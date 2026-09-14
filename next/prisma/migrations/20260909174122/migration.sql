-- CreateEnum
CREATE TYPE "InAppNotificationStatus" AS ENUM ('ACTIVE', 'DRAFT', 'EXPIRED', 'SCHEDULED');

-- CreateEnum
CREATE TYPE "InAppNotificationType" AS ENUM ('ACTION_REQUIRED', 'INFORMATION', 'REMINDER', 'SYSTEM_MAINTENANCE', 'WARNING');

-- CreateTable
CREATE TABLE "in_app_notification" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "status" "InAppNotificationStatus" NOT NULL,
    "type" "InAppNotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "start_timestamp" TIMESTAMPTZ(6) NOT NULL,
    "end_timestamp" TIMESTAMPTZ(6) NOT NULL,
    "all_suppliers" BOOLEAN NOT NULL,

    CONSTRAINT "in_app_notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "in_app_notification_organization" (
    "in_app_notification_id" INTEGER NOT NULL,
    "organization_id" INTEGER NOT NULL,

    CONSTRAINT "in_app_notification_organization_pkey" PRIMARY KEY ("in_app_notification_id","organization_id")
);

-- AddForeignKey
ALTER TABLE "in_app_notification" ADD CONSTRAINT "in_app_notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "in_app_notification_organization" ADD CONSTRAINT "in_app_notification_organization_in_app_notification_id_fkey" FOREIGN KEY ("in_app_notification_id") REFERENCES "in_app_notification"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "in_app_notification_organization" ADD CONSTRAINT "in_app_notification_organization_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
