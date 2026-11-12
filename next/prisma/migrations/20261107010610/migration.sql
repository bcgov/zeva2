/*
  Warnings:

  - The values [APPROVED,RECOMMEND_APPROVAL] on the enum `CreditApplicationStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [APPROVED] on the enum `CreditApplicationSupplierStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "CreditApplicationStatus_new" AS ENUM ('DRAFT', 'ISSUED', 'RECOMMENDED', 'REJECTED', 'RETURNED_TO_ANALYST', 'SUBMITTED', 'VALIDATED');
ALTER TABLE "credit_application" ALTER COLUMN "status" TYPE "CreditApplicationStatus_new" USING ("status"::text::"CreditApplicationStatus_new");
ALTER TABLE "credit_application_history" ALTER COLUMN "user_action" TYPE "CreditApplicationStatus_new" USING ("user_action"::text::"CreditApplicationStatus_new");
ALTER TYPE "CreditApplicationStatus" RENAME TO "CreditApplicationStatus_old";
ALTER TYPE "CreditApplicationStatus_new" RENAME TO "CreditApplicationStatus";
DROP TYPE "public"."CreditApplicationStatus_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "CreditApplicationSupplierStatus_new" AS ENUM ('DRAFT', 'ISSUED', 'REJECTED', 'SUBMITTED');
ALTER TABLE "credit_application" ALTER COLUMN "supplier_status" TYPE "CreditApplicationSupplierStatus_new" USING ("supplier_status"::text::"CreditApplicationSupplierStatus_new");
ALTER TYPE "CreditApplicationSupplierStatus" RENAME TO "CreditApplicationSupplierStatus_old";
ALTER TYPE "CreditApplicationSupplierStatus_new" RENAME TO "CreditApplicationSupplierStatus";
DROP TYPE "public"."CreditApplicationSupplierStatus_old";
COMMIT;
