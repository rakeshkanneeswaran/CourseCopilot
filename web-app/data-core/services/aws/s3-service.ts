import { S3Client, PutObjectCommand, ListObjectsV2Command, GetObjectCommand, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import prismaClient from "@/data-core/database";
import logger from "@/data-core/utils/logger";

const s3 = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

export class S3Service {
    static async uploadVideoFile({ bucket, formData, userData }: {
        bucket: string, formData: FormData, userData: {
            userId: string,
            projectId: string
        }
    }) {
        try {
            const file = formData.get("file");
            if (!(file instanceof File)) {
                logger.warn("Invalid file provided for upload.");
                return { success: false, error: "Invalid file provided." };
            }

            const buffer = Buffer.from(await file.arrayBuffer());
            const uploadedFile = formData.get("file") as File;
            const fileName = uploadedFile.name;
            const filePath = `${userData.userId}/${userData.projectId}/original_content/videos/${fileName}`;

            logger.info(`Uploading file to S3: ${filePath} in bucket: ${bucket}`);

            const putObjectCommand = new PutObjectCommand({
                Bucket: bucket,
                Key: filePath,
                Body: buffer,
                ContentType: file.type,
            });

            await s3.send(putObjectCommand);

            logger.info(`File successfully uploaded to S3: ${filePath}`);

            return {
                success: true, data: {
                    fileName,
                    filePath,
                    bucket,
                    userId: userData.userId,
                    projectId: userData.projectId,
                }
            };
        } catch (error) {
            logger.error(`Failed to upload video file to S3: ${error}`, { bucket, userData });
            throw new Error('Failed to upload video file to S3');
        }
    }

    static async getProjectFileUrl({ userData }: {
        userData: {
            userId: string,
            projectId: string
        }
    }) {
        try {
            logger.info(`Fetching project files for user ${userData.userId}, project ${userData.projectId}`);

            const videoMetaData = await prismaClient.video.findMany({
                where: {
                    projectId: userData.projectId,
                    project: {
                        userId: userData.userId
                    }
                },
                select: {
                    videoMetaData: true
                },
                orderBy: {
                    position: 'asc'
                }
            });

            logger.debug(`Retrieved video metadata: ${JSON.stringify(videoMetaData)}`);

            const preSignedFilesUrls = await Promise.all(
                videoMetaData.map(async (eachVideoMetaData) => {
                    const getS3objectCommand = new GetObjectCommand({
                        Bucket: eachVideoMetaData.videoMetaData?.bucketName,
                        Key: eachVideoMetaData.videoMetaData?.keyName,
                    });
                    const url = await getSignedUrl(s3, getS3objectCommand, { expiresIn: 900 });

                    return {
                        name: eachVideoMetaData.videoMetaData!.fileName,
                        url,
                    };
                })
            );

            logger.info("Successfully generated pre-signed URLs for project files.");
            return preSignedFilesUrls;
        } catch (error) {
            logger.error(`Failed to fetch project files from S3: ${error}`, { userData });
            throw new Error('Failed to fetch project files from S3');
        }
    }

    static async deleteProjectFiles({ userData }: {
        userData: {
            userId: string,
            projectId: string
        }
    }) {
        try {
            const bucket = process.env.VIDEO_BUCKET_NAME!;
            logger.info(`Deleting all project files for user ${userData.userId}, project ${userData.projectId}`);

            const listCommand = new ListObjectsV2Command({
                Bucket: bucket,
                Prefix: `${userData.userId}/${userData.projectId}/`,
            });

            const listResponse = await s3.send(listCommand);
            const objects = listResponse.Contents;

            if (!objects || objects.length === 0) {
                logger.info("No objects found for deletion.");
                return;
            }

            logger.debug(`Files to be deleted: ${JSON.stringify(objects.map(obj => obj.Key))}`);

            const deleteCommand = new DeleteObjectsCommand({
                Bucket: bucket,
                Delete: {
                    Objects: objects.map(obj => ({ Key: obj.Key })),
                },
            });

            await s3.send(deleteCommand);
            logger.info("Project files successfully deleted from S3.");
        } catch (error) {
            logger.error(`Failed to delete project files from S3: ${error}`, { userData });
            throw new Error('Failed to delete project files from S3');
        }
    }

    static async getFilesForSpecificLanguage({ userId, projectId, language }: { userId: string, projectId: string, language: string }) {
        try {
            logger.info(`Fetching translated files for user ${userId}, project ${projectId}, language ${language}`);

            const videoMetaData = await prismaClient.video.findMany({
                where: {
                    projectId: projectId,
                    project: {
                        userId: userId
                    }
                },
                select: {
                    videoMetaData: true
                },
                orderBy: {
                    position: 'asc'
                }
            });

            logger.debug(`Retrieved translated video metadata: ${JSON.stringify(videoMetaData)}`);

            const preSignedFilesUrls = await Promise.all(
                videoMetaData.map(async (eachVideoMetaData) => {
                    const getS3objectCommand = new GetObjectCommand({
                        Bucket: eachVideoMetaData.videoMetaData?.bucketName,
                        Key: `${userId}/${projectId}/translations/${language}/videos/${eachVideoMetaData.videoMetaData?.fileName}`
                    });
                    const url = await getSignedUrl(s3, getS3objectCommand, { expiresIn: 900 });

                    return {
                        name: eachVideoMetaData.videoMetaData!.fileName,
                        url,
                    };
                })
            );

            logger.info(`Successfully generated pre-signed URLs for translated files in ${language}.`);
            return preSignedFilesUrls;
        } catch (error) {
            logger.error(`Failed to fetch translated files from S3: ${error}`, { userId, projectId, language });
            throw new Error('Failed to fetch files from specific folder in S3');
        }
    }

    static async getPresignedUrl({ bucket, key }: { bucket: string, key: string }) {
        try {
            logger.info(`Generating pre-signed URL for file: ${key} in bucket: ${bucket}`);

            const getS3objectCommand = new GetObjectCommand({
                Bucket: bucket,
                Key: key
            });

            const url = await getSignedUrl(s3, getS3objectCommand, { expiresIn: 3600 });

            logger.info("Pre-signed URL successfully generated.");
            return url;
        } catch (error) {
            logger.error(`Failed to create pre-signed URL: ${error}`, { bucket, key });
            throw new Error('Failed to create pre-signed URL for the file');
        }
    }

    static async uploadProjectThumbnail({ projectId, userId, thumbnail }: { projectId: string, userId: string, thumbnail: File }) {
        try {
            const fileExtension = thumbnail.name.split('.').pop();
            const fileName = `thumbnail.${fileExtension}`;
            const key = `${userId}/${projectId}/thumbnails/${fileName}`;
            const bucket = process.env.VIDEO_BUCKET_NAME!;
            const fileBuffer = await thumbnail.arrayBuffer();
            const params = {
                Bucket: bucket, // Your S3 bucket name
                Key: key,
                Body: Buffer.from(fileBuffer),
                ContentType: thumbnail.type, // Set the file type
            };
            const command = new PutObjectCommand(params);
            await s3.send(command);
        } catch (error) {
            logger.error(`Failed to upload project thumbnail to S3: ${error}`, { userId, projectId });
            throw new Error('Failed to upload project thumbnail to S3');
        }
    }
}
