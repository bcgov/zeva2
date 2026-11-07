/*
  Warnings:

  - You are about to drop the column `last_validated_timestamp` on the `credit_application` table. All the data in the column will be lost.
  - You are about to drop the column `validated_by_id` on the `credit_application` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "CreditApplicationStatus" ADD VALUE 'VALIDATED';

-- DropForeignKey
ALTER TABLE "credit_application" DROP CONSTRAINT "credit_application_validated_by_id_fkey";

-- AlterTable
ALTER TABLE "credit_application" DROP COLUMN "last_validated_timestamp",
DROP COLUMN "validated_by_id";
