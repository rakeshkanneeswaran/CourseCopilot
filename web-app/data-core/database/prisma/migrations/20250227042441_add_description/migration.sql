/*
  Warnings:

  - The `position` column on the `Video` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "Video" DROP COLUMN "position",
ADD COLUMN     "position" INTEGER;
