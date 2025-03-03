"use server"
import { ProjectService } from "@/data-core/services/project-service";


export async function getProjectDetailsFromS3({ userId, projectId }: { userId: string, projectId: string }) {
    try {
        const videoUrls = await ProjectService.getProjectDetailsFromS3({ userId, projectId })
        return videoUrls;
    } catch (error) {

        console.error('Error fetching project details from S3:', error);
        throw new Error(`Unable to fetch project details from S3 for user data userId ; ${userId}  projectId ${projectId} `);
    }
}

export async function deleteProject({ userId, projectId }: { userId: string, projectId: string }) {
    try {
        await ProjectService.deleteProject({ userId, projectId });
        return "Project deleted successfully";
    } catch (error) {
        console.error('Error deleting project:', error);
        throw new Error(`Unable to delete project for user data userId ; ${userId}  projectId ${projectId} `);
    }
}

export async function getContentForSpecificLanguage({ projectId, userId, language }: { projectId: string, userId: string, language: string }) {
    try {
        const content = await ProjectService.getSpecificLanguageContent({ projectId, userId, language });
        return content;
    } catch (error) {
        console.error('Error fetching content:', error);
        throw new Error(`Unable to fetch content for user data userId ; ${userId}  projectId ${projectId} `);
    }
}