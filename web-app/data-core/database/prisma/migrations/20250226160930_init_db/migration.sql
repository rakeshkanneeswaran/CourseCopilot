-- CreateTable
CREATE TABLE "Credentials" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "Credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "credentialId" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectS3DetailsId" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Video" (
    "id" TEXT NOT NULL,
    "position" TEXT,
    "projectId" TEXT NOT NULL,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoMetadata" (
    "id" TEXT NOT NULL,
    "keyName" TEXT NOT NULL,
    "bucketName" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,

    CONSTRAINT "VideoMetadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectS3Details" (
    "id" TEXT NOT NULL,
    "bucketName" TEXT NOT NULL,
    "keyName" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,

    CONSTRAINT "ProjectS3Details_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Credentials_username_key" ON "Credentials"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_credentialId_key" ON "User"("credentialId");

-- CreateIndex
CREATE UNIQUE INDEX "Project_projectS3DetailsId_key" ON "Project"("projectS3DetailsId");

-- CreateIndex
CREATE UNIQUE INDEX "Project_videoId_key" ON "Project"("videoId");

-- CreateIndex
CREATE UNIQUE INDEX "VideoMetadata_videoId_key" ON "VideoMetadata"("videoId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectS3Details_projectId_key" ON "ProjectS3Details"("projectId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_credentialId_fkey" FOREIGN KEY ("credentialId") REFERENCES "Credentials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoMetadata" ADD CONSTRAINT "VideoMetadata_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectS3Details" ADD CONSTRAINT "ProjectS3Details_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
