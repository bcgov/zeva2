/*
  Warnings:

  - You are about to drop the column `validated_up_to_icbc_timestamp` on the `credit_application` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "credit_application" DROP COLUMN "validated_up_to_icbc_timestamp",
ADD COLUMN     "last_validated_timestamp" TIMESTAMPTZ(6);
