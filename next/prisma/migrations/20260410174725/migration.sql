/*
  Warnings:

  - You are about to drop the column `must_revalidate` on the `credit_application` table. All the data in the column will be lost.
  - You are about to drop the column `part_of_myr_model_year` on the `credit_application` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "credit_application" DROP COLUMN "must_revalidate",
DROP COLUMN "part_of_myr_model_year",
ADD COLUMN     "compliance_year" "ModelYear";
