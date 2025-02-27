/*
  Warnings:

  - You are about to drop the column `projectS3DetailsId` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the `ProjectS3Details` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ProjectS3Details" DROP CONSTRAINT "ProjectS3Details_projectId_fkey";

-- DropIndex
DROP INDEX "Project_projectS3DetailsId_key";

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "projectS3DetailsId";

-- DropTable
DROP TABLE "ProjectS3Details";
