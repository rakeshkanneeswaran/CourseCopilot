import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

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
            const key = uploadedFile.name;
            const putObjectCommand = new PutObjectCommand({
                Bucket: bucket,
                Key: `${userData.userId}/${userData.projectId}/${key}`,
                Body: buffer,
                ContentType: file.type,
            });

            const result = await s3.send(putObjectCommand);
            return { success: true, data: result };
        } catch (error) {
            console.error("S3 Upload Error:", error, { bucket });
            return { success: false, error: `Error while uploading file to S3 bucket. Details: bucket=${bucket}` };
        }
    }
}
