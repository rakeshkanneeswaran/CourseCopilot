-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "projectMetaDataId" TEXT;

-- CreateTable
CREATE TABLE "ProjectMetaData" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "generate_translate" BOOLEAN NOT NULL,
    "generate_subtitle" BOOLEAN NOT NULL,
    "languages" TEXT[],
    "generate_transcript" BOOLEAN NOT NULL,
    "gender" TEXT NOT NULL,

    CONSTRAINT "ProjectMetaData_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectMetaData_projectId_key" ON "ProjectMetaData"("projectId");

-- AddForeignKey
ALTER TABLE "ProjectMetaData" ADD CONSTRAINT "ProjectMetaData_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
