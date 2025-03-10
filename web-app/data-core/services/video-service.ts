import prismaClient from "../database";
import { S3Service } from "./aws/s3-service";
import logger from "../utils/logger";

export class VideoService {
    static async uploadVideo(formData: FormData, userData: { userId: string, projectId: string }, position: number) {
        try {
            logger.info(`Starting video upload for user ${userData.userId} in project ${userData.projectId}`);

            const uploadVideoResult = await S3Service.uploadVideoFile({
                bucket: process.env.VIDEO_BUCKET_NAME!,
                formData,
                userData
            });

            logger.debug(`Upload result: ${JSON.stringify(uploadVideoResult)}`);

            const result = await prismaClient.$transaction(async (tx) => {
                const video = await tx.video.create({
                    data: {
                        projectId: userData.projectId,
                        position
                    }
                });

                logger.info(`Video entry created in DB with ID: ${video.id}`);

                if (!uploadVideoResult.data?.filePath || !uploadVideoResult.data?.bucket) {
                    logger.warn("File path or bucket name is missing from upload result.");
                    throw new Error("File path or bucket name is missing.");
                }

                await tx.videoMetadata.create({
                    data: {
                        videoId: video.id,
                        keyName: uploadVideoResult.data.filePath,
                        bucketName: uploadVideoResult.data.bucket,
                        fileName: uploadVideoResult.data.fileName
                    }
                });

                logger.info(`Video metadata created for video ID: ${video.id}`);
                return uploadVideoResult;
            });

            logger.info("Video upload and metadata storage successful.");
            return result;

        } catch (error) {
            logger.error(`Error uploading video: ${error}`);
            throw new Error("File path or bucket name is missing.");
        }
    }
}
