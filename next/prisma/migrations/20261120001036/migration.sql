/*
  Warnings:

  - You are about to drop the column `transaction_timestamp` on the `credit_application` table. All the data in the column will be lost.
  - You are about to drop the column `numberOfUnits` on the `vehicle` table. All the data in the column will be lost.
  - Added the required column `legacy_number_of_units` to the `credit_application_record` table without a default value. This is not possible if the table is not empty.
  - Added the required column `legacy_number_of_units` to the `vehicle` table without a default value. This is not possible if the table is not empty.
  - Added the required column `number_of_units` to the `vehicle` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "credit_application" DROP COLUMN "transaction_timestamp",
ADD COLUMN     "is_supplementary" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "transaction_timestamps" TIMESTAMPTZ(6)[] DEFAULT ARRAY[]::TIMESTAMPTZ(6)[];

-- AlterTable
ALTER TABLE "credit_application_record" ADD COLUMN     "legacy_number_of_units" DECIMAL(65,2) NOT NULL;

-- AlterTable
ALTER TABLE "vehicle" DROP COLUMN "numberOfUnits",
ADD COLUMN     "legacy_number_of_units" DECIMAL(65,2) NOT NULL,
ADD COLUMN     "number_of_units" DECIMAL(65,2) NOT NULL;
