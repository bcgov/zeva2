-- AlterTable
ALTER TABLE "credit_application" ADD COLUMN     "validated_by_id" INTEGER;

-- AddForeignKey
ALTER TABLE "credit_application" ADD CONSTRAINT "credit_application_validated_by_id_fkey" FOREIGN KEY ("validated_by_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
