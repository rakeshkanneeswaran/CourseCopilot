/*
  Warnings:

  - Added the required column `position` to the `VideoMetadata` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "VideoMetadata" ADD COLUMN     "position" INTEGER NOT NULL;
