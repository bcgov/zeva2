/*
  Warnings:

  - The values [REJECTED] on the enum `PenaltyCreditStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PenaltyCreditStatus_new" AS ENUM ('APPROVED', 'DRAFT', 'RETURNED_TO_ANALYST', 'SUBMITTED_TO_DIRECTOR');
ALTER TABLE "penalty_credit" ALTER COLUMN "status" TYPE "PenaltyCreditStatus_new" USING ("status"::text::"PenaltyCreditStatus_new");
ALTER TABLE "penalty_credit_history" ALTER COLUMN "user_action" TYPE "PenaltyCreditStatus_new" USING ("user_action"::text::"PenaltyCreditStatus_new");
ALTER TYPE "PenaltyCreditStatus" RENAME TO "PenaltyCreditStatus_old";
ALTER TYPE "PenaltyCreditStatus_new" RENAME TO "PenaltyCreditStatus";
DROP TYPE "public"."PenaltyCreditStatus_old";
COMMIT;
