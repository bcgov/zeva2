/*
  Warnings:

  - Added the required column `idp_email` to the `user` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `user` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "user" ADD COLUMN     "idp_email" TEXT NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL;
