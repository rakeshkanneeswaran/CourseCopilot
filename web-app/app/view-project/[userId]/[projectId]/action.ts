"use server"
import { ProjectService } from "@/data-core/services/project-service";
import logger from "@/data-core/utils/logger";




export async function getProjectDetailsFromS3({ userId, projectId }: { userId: string, projectId: string }) {
    try {
        const videoUrls = await ProjectService.getProjectDetailsFromS3({ userId, projectId })
        return videoUrls;
    } catch (error) {

        logger.error('Error fetching project details from S3:', error);
        throw new Error(`Unable to fetch project details from S3 for user data userId ; ${userId}  projectId ${projectId} `);
    }
}

export async function deleteProject({ userId, projectId }: { userId: string, projectId: string }) {
    try {
        await ProjectService.deleteProject({ userId, projectId });
        return "Project deleted successfully";
    } catch (error) {
        logger.error('Error deleting project:', error);
        throw new Error(`Unable to delete project for user data userId ; ${userId}  projectId ${projectId} `);
    }
}

export async function getContentForSpecificLanguage({ projectId, userId, language }: { projectId: string, userId: string, language: string }) {
    try {
        const content = await ProjectService.getSpecificLanguageContent({ projectId, userId, language });
        return content;
    } catch (error) {
        logger.error('Error fetching content:', error);
        throw new Error(`Unable to fetch content for user data userId ; ${userId}  projectId ${projectId} `);
    }
}

export async function getProjectDetails({ projectId, userId }: { projectId: string, userId: string }) {
    try {
        const projectDetails = await ProjectService.getProjectDetails({ projectId, userId });
        return projectDetails;
    } catch (error) {
        logger.error('Error fetching project details:', error);
        throw new Error(`Unable to fetch project details for user data userId ; ${userId}  projectId ${projectId} `);
    }
}

export async function getOriginalContent({ userId, projectId }: { userId: string, projectId: string }) {
    try {
        const result = await ProjectService.getProjectOriginalContent({ userId, projectId });
        return result;
    } catch (error) {
        logger.error('Error getting original content:', error);
        throw new Error('Failed to get original content');
    }
}

export async function getContentForDifferentLanguage({ userId, projectId, languageName }: { userId: string, projectId: string, languageName: string }) {
    try {
        const result = await ProjectService.getProjectContentForDifferentLanguages({ userId, projectId, languageName })
        return result
    } catch (error) {
        logger.error('Error getting content for Different:', error);
        throw new Error('Failed to get  content for Different language');

    }

}

export async function getMcqQuestions({ userId, projectId }: { userId: string, projectId: string }) {
    try {
        const data = await ProjectService.getGetMcqQuestions({ userId, projectId });
        return data;
    } catch (error) {
        logger.error('Error getting mcq questions:', error);
        throw new Error('Failed to get mcq questions');
    }
}

