"use server"

import { VideoService } from "@/data-core/services/video-service";
export async function uploadVideo(formData: FormData, userData: { userId: string, projectId: string }) {
    try {
        const result = await VideoService.uploadVideo(formData, userData)
        return result.success;
    } catch (error) {
        console.error('Error uploading video:', error);
    }

}