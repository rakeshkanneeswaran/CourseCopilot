"use server"

import { BackgroundService } from "@/data-core/services/background-service";
import { VideoService } from "@/data-core/services/video-service";

interface ProjectMetaData {
    generate_translate: boolean;
    generate_subtitle: boolean;
    languages: string[];
    generate_transcript: boolean;
}

export async function uploadVideo(formData: FormData, userData: { userId: string, projectId: string }, position: number) {
    try {
        const result = await VideoService.uploadVideo(formData, userData, position)
        return result.success;
    } catch (error) {
        console.error('Error uploading video:', error);
    }
}

export async function initiateBackground({ userId, projectId, projectMetaData }: { userId: string, projectId: string, projectMetaData: ProjectMetaData }) {
    try {
        const result = await BackgroundService.initiateBackground({ userId, projectId, projectMetaData })
        return result
    } catch (error) {
        console.error('Error sending message to kafka:', error);
        throw new Error('Failed to initiate background process');
    }
}