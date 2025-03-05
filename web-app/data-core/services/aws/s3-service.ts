import { S3Client, PutObjectCommand, ListObjectsV2Command, GetObjectCommand, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import prismaClient from "@/data-core/database";

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
                return { success: false, error: "Invalid file provided." };
            }
            const buffer = Buffer.from(await file.arrayBuffer());
            const uploadedFile = formData.get("file") as File;
            const fileName = uploadedFile.name;
            const filePath = `${userData.userId}/${userData.projectId}/original_content/videos/${fileName}`;
            const putObjectCommand = new PutObjectCommand({
                Bucket: bucket,
                Key: filePath,
                Body: buffer,
                ContentType: file.type,
            });
            await s3.send(putObjectCommand);
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
            console.error("S3 Upload Error:", error, { bucket });
            throw error
        }
    }

    static async getProjectFileUrl({ userData }: {
        userData: {
            userId: string,
            projectId: string
        }
    }) {
        try {
            const videoMetaData = await prismaClient.video.findMany({
                where: {
                    projectId: userData.projectId,
                    project: {
                        userId: userData.userId
                    }
                },
                select: {
                    videoMetaData: true
                }
                ,
                orderBy: {
                    position: 'asc'
                }
            })
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

            return preSignedFilesUrls;
        } catch (error) {
            console.error("S3 GetProjectFiles Error:", error, { userData });
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
            const listCommand = new ListObjectsV2Command({
                Bucket: bucket,
                Prefix: `${userData.userId}/${userData.projectId}/`,
            });

            const listResponse = await s3.send(listCommand);
            const objects = listResponse.Contents;

            if (!objects || objects.length === 0) {
                console.log("No objects found in the folder.");
                return;
            }
            const deleteCommand = new DeleteObjectsCommand({
                Bucket: bucket,
                Delete: {
                    Objects: objects.map(obj => ({ Key: obj.Key })),
                },
            });
            await s3.send(deleteCommand);
        } catch (error) {
            console.error("S3 DeleteProjectFiles Error:", error, { userData });
            throw new Error('Failed to delete project files from S3');
        }
    }

    static async getFilesForSpecificLanguage({ userId, projectId, language }: { userId: string, projectId: string, language: string }) {
        try {
            const videoMetaData = await prismaClient.video.findMany({
                where: {
                    projectId: projectId,
                    project: {
                        userId: userId
                    }
                },
                select: {
                    videoMetaData: true
                }
                ,
                orderBy: {
                    position: 'asc'
                }
            })

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

            return preSignedFilesUrls;


        } catch (error) {
            console.error("S3 GetFilesFromSpecificFolder Error:", error, { userId, projectId, language });
            throw new Error('Failed to fetch files from specific folder in S3');

        }
    }

    static async getPresignedUrl({ bucket, key }: { bucket: string, key: string }) {

        try {
            const getS3objectCommand = new GetObjectCommand({
                Bucket: bucket,
                Key: key
            });
            const url = await getSignedUrl(s3, getS3objectCommand, { expiresIn: 900 });
            return url
        } catch (error) {
            console.error("S3 GetPresignedUrl Error:", error, { bucket, key });
            throw new Error('Failed to create presigned url for the file');
        }


    }
}
