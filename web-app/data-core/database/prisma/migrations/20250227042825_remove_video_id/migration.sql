/*
  Warnings:

  - You are about to drop the column `videoId` on the `Project` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Project_videoId_key";

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "videoId";
