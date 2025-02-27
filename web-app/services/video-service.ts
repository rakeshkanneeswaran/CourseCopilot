import { S3Service } from "./aws/s3-service";

export class VideoService {
    static async uploadVideo(formData: FormData, userData: { userId: string, projectId: string }) {
        try {
            const uploadVideoResult = await S3Service.uploadVideoFile({ bucket: "eduverseai-production", formData, userData })
            return uploadVideoResult
        } catch (error) {
            console.error(error);
            throw new Error('Failed to upload video');
        }
    }
}