/*
  Warnings:

  - You are about to drop the column `issued_count` on the `vehicle` table. All the data in the column will be lost.
  - You are about to drop the column `submitted_count` on the `vehicle` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[vin_list_object_name]` on the table `model_year_report` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[vin_list_object_name]` on the table `supplementary_report` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `vin_list_file_name` to the `model_year_report` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vin_list_object_name` to the `model_year_report` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vin_list_file_name` to the `supplementary_report` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vin_list_object_name` to the `supplementary_report` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "model_year_report" ADD COLUMN     "vin_list_file_name" TEXT NOT NULL,
ADD COLUMN     "vin_list_object_name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "supplementary_report" ADD COLUMN     "vin_list_file_name" TEXT NOT NULL,
ADD COLUMN     "vin_list_object_name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "vehicle" DROP COLUMN "issued_count",
DROP COLUMN "submitted_count";

-- CreateTable
CREATE TABLE "legacy_vin_records" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "vin" VARCHAR(17) NOT NULL,
    "timestamp" TIMESTAMPTZ(6) NOT NULL,
    "vehicle_class" "VehicleClass" NOT NULL,
    "zev_class" "ZevClass" NOT NULL,
    "model_year" "ModelYear" NOT NULL,
    "make" TEXT NOT NULL,
    "model_name" TEXT NOT NULL,
    "zev_type" "ZevType" NOT NULL,
    "range" INTEGER NOT NULL,

    CONSTRAINT "legacy_vin_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "legacy_vin_records_vin_key" ON "legacy_vin_records"("vin");

-- CreateIndex
CREATE INDEX "legacy_vin_records_model_year_timestamp_idx" ON "legacy_vin_records"("model_year", "timestamp");

-- CreateIndex
CREATE INDEX "credit_application_record_vin_idx" ON "credit_application_record"("vin");

-- CreateIndex
CREATE INDEX "credit_application_record_model_year_timestamp_idx" ON "credit_application_record"("model_year", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "model_year_report_vin_list_object_name_key" ON "model_year_report"("vin_list_object_name");

-- CreateIndex
CREATE UNIQUE INDEX "supplementary_report_vin_list_object_name_key" ON "supplementary_report"("vin_list_object_name");

-- AddForeignKey
ALTER TABLE "legacy_vin_records" ADD CONSTRAINT "legacy_vin_records_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
