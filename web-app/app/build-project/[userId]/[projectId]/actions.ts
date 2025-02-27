"use server"

import { VideoService } from "@/services/video-service";
export async function uploadVideo(formData: FormData) {
    try {
        const result = await VideoService.uploadVideo(formData)
        return result.success;
    } catch (error) {
        console.error('Error uploading video:', error);
    }

}