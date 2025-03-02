import prismaClient from "../database";
import { S3Service } from "./aws/s3-service";

export class VideoService {
    static async uploadVideo(formData: FormData, userData: { userId: string, projectId: string }, position: number) {
        try {
            const uploadVideoResult = await S3Service.uploadVideoFile({ bucket: "course-co-pilot-dev", formData, userData })

            const result = await prismaClient.$transaction(async (tx) => {
                const video = await tx.video.create({
                    data: {
                        projectId: userData.projectId,
                        position
                    }
                })

                if (!uploadVideoResult.data?.filePath || !uploadVideoResult.data?.bucket) {
                    throw new Error("File path or bucket name is missing.");
                }

                await tx.videoMetadata.create({
                    data: {
                        videoId: video.id,
                        keyName: uploadVideoResult.data.filePath,
                        bucketName: uploadVideoResult.data.bucket,
                        fileName: uploadVideoResult.data.fileName

                    }
                })
                return uploadVideoResult
            })

            return result;

        } catch (error) {
            console.error(error);
            throw new Error('Failed to upload video');
        }
    }
}