/*
  Warnings:

  - Added the required column `fileName` to the `VideoMetadata` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "VideoMetadata" ADD COLUMN     "fileName" TEXT NOT NULL;
