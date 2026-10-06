-- AlterEnum
ALTER TYPE "InAppNotificationStatus" ADD VALUE 'CANCELLED';

-- AlterTable
ALTER TABLE "in_app_notification"
ADD COLUMN "has_been_published" BOOLEAN NOT NULL DEFAULT false;

UPDATE "in_app_notification"
SET "has_been_published" = true
WHERE "status" IN ('ACTIVE', 'SCHEDULED', 'EXPIRED');
