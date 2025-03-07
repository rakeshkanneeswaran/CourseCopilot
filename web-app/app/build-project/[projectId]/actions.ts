"use server"

import { BackgroundService } from "@/data-core/services/background-service";
import { ProjectService } from "@/data-core/services/project-service";
import { VideoService } from "@/data-core/services/video-service";

interface ProjectMetaData {
    generate_translate: boolean;
    generate_subtitle: boolean;
    languages: string[];
    generate_transcript: boolean;
    gender: string;
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
        console.error('Failed to initiate background process:', error);
        throw new Error('Failed to initiate background process');
    }
}

export async function getOriginalContent({ userId, projectId }: { userId: string, projectId: string }) {
    try {
        const result = await ProjectService.getProjectOriginalContent({ userId, projectId });
        return result;
    } catch (error) {
        console.error('Error getting original content:', error);
        throw new Error('Failed to get original content');
    }
}