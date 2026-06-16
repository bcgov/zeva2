/*
  Warnings:

  - You are about to drop the `reassessment_guard` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "reassessment_guard" DROP CONSTRAINT "reassessment_guard_organization_id_fkey";

-- DropTable
DROP TABLE "reassessment_guard";
