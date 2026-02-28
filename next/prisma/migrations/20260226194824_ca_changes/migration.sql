/*
  Warnings:

  - The values [RETURNED_TO_SUPPLIER] on the enum `CreditApplicationHistoryStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [RETURNED_TO_SUPPLIER] on the enum `CreditApplicationStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [RETURNED_TO_SUPPLIER] on the enum `CreditApplicationSupplierStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `organization_id` on the `agreement_attachment` table. All the data in the column will be lost.
  - You are about to drop the column `icbc_timestamp` on the `credit_application` table. All the data in the column will be lost.
  - You are about to drop the column `supplier_name` on the `credit_application` table. All the data in the column will be lost.
  - You are about to drop the column `transaction_timestamps` on the `credit_application` table. All the data in the column will be lost.
  - You are about to drop the column `organization_id` on the `credit_application_attachment` table. All the data in the column will be lost.
  - You are about to drop the column `organization_id` on the `vehicle_attachment` table. All the data in the column will be lost.
  - Made the column `agreement_id` on table `agreement_attachment` required. This step will fail if there are existing NULL values in that column.
  - Made the column `file_name` on table `agreement_attachment` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `legal_name` to the `credit_application` table without a default value. This is not possible if the table is not empty.
  - Made the column `credit_application_id` on table `credit_application_attachment` required. This step will fail if there are existing NULL values in that column.
  - Made the column `file_name` on table `credit_application_attachment` required. This step will fail if there are existing NULL values in that column.
  - Made the column `vehicle_id` on table `vehicle_attachment` required. This step will fail if there are existing NULL values in that column.
  - Made the column `file_name` on table `vehicle_attachment` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "CreditApplicationHistoryStatus_new" AS ENUM ('APPROVED', 'RECOMMEND_APPROVAL', 'REJECTED', 'RETURNED_TO_ANALYST', 'SUBMITTED');
ALTER TABLE "credit_application_history" ALTER COLUMN "user_action" TYPE "CreditApplicationHistoryStatus_new" USING ("user_action"::text::"CreditApplicationHistoryStatus_new");
ALTER TYPE "CreditApplicationHistoryStatus" RENAME TO "CreditApplicationHistoryStatus_old";
ALTER TYPE "CreditApplicationHistoryStatus_new" RENAME TO "CreditApplicationHistoryStatus";
DROP TYPE "public"."CreditApplicationHistoryStatus_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "CreditApplicationStatus_new" AS ENUM ('APPROVED', 'DRAFT', 'RECOMMEND_APPROVAL', 'REJECTED', 'RETURNED_TO_ANALYST', 'SUBMITTED');
ALTER TABLE "credit_application" ALTER COLUMN "status" TYPE "CreditApplicationStatus_new" USING ("status"::text::"CreditApplicationStatus_new");
ALTER TYPE "CreditApplicationStatus" RENAME TO "CreditApplicationStatus_old";
ALTER TYPE "CreditApplicationStatus_new" RENAME TO "CreditApplicationStatus";
DROP TYPE "public"."CreditApplicationStatus_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "CreditApplicationSupplierStatus_new" AS ENUM ('APPROVED', 'DRAFT', 'REJECTED', 'SUBMITTED');
ALTER TABLE "credit_application" ALTER COLUMN "supplier_status" TYPE "CreditApplicationSupplierStatus_new" USING ("supplier_status"::text::"CreditApplicationSupplierStatus_new");
ALTER TYPE "CreditApplicationSupplierStatus" RENAME TO "CreditApplicationSupplierStatus_old";
ALTER TYPE "CreditApplicationSupplierStatus_new" RENAME TO "CreditApplicationSupplierStatus";
DROP TYPE "public"."CreditApplicationSupplierStatus_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "agreement_attachment" DROP CONSTRAINT "agreement_attachment_agreement_id_fkey";

-- DropForeignKey
ALTER TABLE "agreement_attachment" DROP CONSTRAINT "agreement_attachment_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "credit_application_attachment" DROP CONSTRAINT "credit_application_attachment_credit_application_id_fkey";

-- DropForeignKey
ALTER TABLE "credit_application_attachment" DROP CONSTRAINT "credit_application_attachment_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "vehicle_attachment" DROP CONSTRAINT "vehicle_attachment_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "vehicle_attachment" DROP CONSTRAINT "vehicle_attachment_vehicle_id_fkey";

-- AlterTable
ALTER TABLE "agreement_attachment" DROP COLUMN "organization_id",
ALTER COLUMN "agreement_id" SET NOT NULL,
ALTER COLUMN "file_name" SET NOT NULL;

-- AlterTable
ALTER TABLE "credit_application" DROP COLUMN "icbc_timestamp",
DROP COLUMN "supplier_name",
DROP COLUMN "transaction_timestamps",
ADD COLUMN     "legal_name" TEXT NOT NULL,
ADD COLUMN     "must_revalidate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "part_of_myr_model_year" "ModelYear",
ADD COLUMN     "transaction_timestamp" TIMESTAMPTZ(6),
ADD COLUMN     "validated_up_to_icbc_timestamp" TIMESTAMPTZ(6),
ALTER COLUMN "makes" SET NOT NULL,
ALTER COLUMN "makes" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "credit_application_attachment" DROP COLUMN "organization_id",
ALTER COLUMN "credit_application_id" SET NOT NULL,
ALTER COLUMN "file_name" SET NOT NULL;

-- AlterTable
ALTER TABLE "credit_application_record" ADD COLUMN     "icbc_timestamp" TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "icbc_file" ADD COLUMN     "create_timestamp" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "uploaded_by_id" INTEGER;

-- AlterTable
ALTER TABLE "vehicle_attachment" DROP COLUMN "organization_id",
ALTER COLUMN "vehicle_id" SET NOT NULL,
ALTER COLUMN "file_name" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "vehicle_attachment" ADD CONSTRAINT "vehicle_attachment_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "icbc_file" ADD CONSTRAINT "icbc_file_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_application_attachment" ADD CONSTRAINT "credit_application_attachment_credit_application_id_fkey" FOREIGN KEY ("credit_application_id") REFERENCES "credit_application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agreement_attachment" ADD CONSTRAINT "agreement_attachment_agreement_id_fkey" FOREIGN KEY ("agreement_id") REFERENCES "agreement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
