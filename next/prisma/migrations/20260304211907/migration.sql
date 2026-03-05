/*
  Warnings:

  - You are about to drop the column `supplierStatus` on the `credit_transfer` table. All the data in the column will be lost.

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

-- AlterTable
ALTER TABLE "credit_transfer" DROP COLUMN "supplierStatus";

-- DropEnum
DROP TYPE "CreditTransferSupplierStatus";
