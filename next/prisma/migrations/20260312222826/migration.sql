/*
  Warnings:

  - You are about to drop the column `is_application` on the `credit_application_attachment` table. All the data in the column will be lost.
  - You are about to drop the column `supplierStatus` on the `credit_transfer` table. All the data in the column will be lost.
  - You are about to drop the column `sequence_number` on the `reassessment` table. All the data in the column will be lost.
  - You are about to drop the column `sequence_number` on the `supplementary_report` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[object_name]` on the table `credit_application` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[idp_sub]` on the table `user` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `file_name` to the `credit_application` table without a default value. This is not possible if the table is not empty.
  - Added the required column `object_name` to the `credit_application` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `status` on the `supplementary_report` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `user_action` on the `supplementary_report_history` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterEnum
ALTER TYPE "CreditTransferStatus" ADD VALUE 'DRAFT';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ModelYear" ADD VALUE 'MY_2014';
ALTER TYPE "ModelYear" ADD VALUE 'MY_2015';
ALTER TYPE "ModelYear" ADD VALUE 'MY_2016';
ALTER TYPE "ModelYear" ADD VALUE 'MY_2037';
ALTER TYPE "ModelYear" ADD VALUE 'MY_2038';
ALTER TYPE "ModelYear" ADD VALUE 'MY_2039';
ALTER TYPE "ModelYear" ADD VALUE 'MY_2040';

-- DropIndex
DROP INDEX "reassessment_organization_id_model_year_sequence_number_key";

-- DropIndex
DROP INDEX "supplementary_report_organization_id_model_year_sequence_nu_key";

-- AlterTable
ALTER TABLE "credit_application" ADD COLUMN     "file_name" TEXT NOT NULL,
ADD COLUMN     "object_name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "credit_application_attachment" DROP COLUMN "is_application";

-- AlterTable
ALTER TABLE "credit_transfer" DROP COLUMN "supplierStatus";

-- AlterTable
ALTER TABLE "reassessment" DROP COLUMN "sequence_number";

-- AlterTable
ALTER TABLE "supplementary_report" DROP COLUMN "sequence_number",
DROP COLUMN "status",
ADD COLUMN     "status" "ModelYearReportStatus" NOT NULL;

-- AlterTable
ALTER TABLE "supplementary_report_history" DROP COLUMN "user_action",
ADD COLUMN     "user_action" "ModelYearReportStatus" NOT NULL;

-- DropEnum
DROP TYPE "CreditTransferSupplierStatus";

-- DropEnum
DROP TYPE "SupplementaryReportStatus";

-- CreateTable
CREATE TABLE "model_year_report_attachment" (
    "id" SERIAL NOT NULL,
    "model_year_report_id" INTEGER NOT NULL,
    "file_name" TEXT NOT NULL,
    "object_name" TEXT NOT NULL,

    CONSTRAINT "model_year_report_attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplementary_report_reassessment" (
    "id" SERIAL NOT NULL,
    "supplementary_report_id" INTEGER NOT NULL,
    "object_name" TEXT NOT NULL,

    CONSTRAINT "supplementary_report_reassessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplementary_report_attachment" (
    "id" SERIAL NOT NULL,
    "supplementary_report_id" INTEGER NOT NULL,
    "file_name" TEXT NOT NULL,
    "object_name" TEXT NOT NULL,

    CONSTRAINT "supplementary_report_attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reassessment_guard" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,

    CONSTRAINT "reassessment_guard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "model_year_report_attachment_object_name_key" ON "model_year_report_attachment"("object_name");

-- CreateIndex
CREATE UNIQUE INDEX "supplementary_report_reassessment_supplementary_report_id_key" ON "supplementary_report_reassessment"("supplementary_report_id");

-- CreateIndex
CREATE UNIQUE INDEX "supplementary_report_reassessment_object_name_key" ON "supplementary_report_reassessment"("object_name");

-- CreateIndex
CREATE UNIQUE INDEX "supplementary_report_attachment_object_name_key" ON "supplementary_report_attachment"("object_name");

-- CreateIndex
CREATE UNIQUE INDEX "reassessment_guard_organization_id_key" ON "reassessment_guard"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "credit_application_object_name_key" ON "credit_application"("object_name");

-- CreateIndex
CREATE UNIQUE INDEX "user_idp_sub_key" ON "user"("idp_sub");

-- AddForeignKey
ALTER TABLE "model_year_report_attachment" ADD CONSTRAINT "model_year_report_attachment_model_year_report_id_fkey" FOREIGN KEY ("model_year_report_id") REFERENCES "model_year_report"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplementary_report_reassessment" ADD CONSTRAINT "supplementary_report_reassessment_supplementary_report_id_fkey" FOREIGN KEY ("supplementary_report_id") REFERENCES "supplementary_report"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplementary_report_attachment" ADD CONSTRAINT "supplementary_report_attachment_supplementary_report_id_fkey" FOREIGN KEY ("supplementary_report_id") REFERENCES "supplementary_report"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reassessment_guard" ADD CONSTRAINT "reassessment_guard_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
