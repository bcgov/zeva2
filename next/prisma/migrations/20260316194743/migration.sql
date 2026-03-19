-- AlterTable
ALTER TABLE "credit_application_record" ADD COLUMN     "decoded_make" TEXT,
ADD COLUMN     "decoded_model_name" TEXT,
ADD COLUMN     "decoded_model_year" "ModelYear";
