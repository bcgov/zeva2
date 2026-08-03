/*
  Warnings:

  - You are about to drop the `CreditApplicationAnalystComment` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "CreditApplicationAnalystComment" DROP CONSTRAINT "CreditApplicationAnalystComment_credit_application_id_fkey";

-- DropForeignKey
ALTER TABLE "CreditApplicationAnalystComment" DROP CONSTRAINT "CreditApplicationAnalystComment_user_id_fkey";

-- DropTable
DROP TABLE "CreditApplicationAnalystComment";

-- CreateTable
CREATE TABLE "credit_application_analyst_comment" (
    "id" SERIAL NOT NULL,
    "credit_application_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "timestamp" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "comment" TEXT NOT NULL,

    CONSTRAINT "credit_application_analyst_comment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "credit_application_analyst_comment" ADD CONSTRAINT "credit_application_analyst_comment_credit_application_id_fkey" FOREIGN KEY ("credit_application_id") REFERENCES "credit_application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_application_analyst_comment" ADD CONSTRAINT "credit_application_analyst_comment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
