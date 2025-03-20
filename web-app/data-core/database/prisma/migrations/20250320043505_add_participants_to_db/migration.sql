-- CreateTable
CREATE TABLE "Participants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParticipantsCredentials" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "emailId" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParticipantsCredentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ParticipantsToProject" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ParticipantsToProject_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "ParticipantsCredentials_participantId_key" ON "ParticipantsCredentials"("participantId");

-- CreateIndex
CREATE UNIQUE INDEX "ParticipantsCredentials_emailId_key" ON "ParticipantsCredentials"("emailId");

-- CreateIndex
CREATE INDEX "_ParticipantsToProject_B_index" ON "_ParticipantsToProject"("B");

-- AddForeignKey
ALTER TABLE "ParticipantsCredentials" ADD CONSTRAINT "ParticipantsCredentials_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ParticipantsToProject" ADD CONSTRAINT "_ParticipantsToProject_A_fkey" FOREIGN KEY ("A") REFERENCES "Participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ParticipantsToProject" ADD CONSTRAINT "_ParticipantsToProject_B_fkey" FOREIGN KEY ("B") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
