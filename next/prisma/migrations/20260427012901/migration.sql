/*
  Warnings:

  - You are about to drop the column `icbc_timestamp` on the `credit_application_record` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "credit_application_record" DROP COLUMN "icbc_timestamp";
