-- CreateTable
CREATE TABLE "CreditApplicationAnalystComment" (
    "id" SERIAL NOT NULL,
    "credit_application_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "timestamp" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "comment" TEXT NOT NULL,

    CONSTRAINT "CreditApplicationAnalystComment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CreditApplicationAnalystComment" ADD CONSTRAINT "CreditApplicationAnalystComment_credit_application_id_fkey" FOREIGN KEY ("credit_application_id") REFERENCES "credit_application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditApplicationAnalystComment" ADD CONSTRAINT "CreditApplicationAnalystComment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
