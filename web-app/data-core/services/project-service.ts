import prismaClient from "@/data-core/database";
import { S3Service } from "./aws/s3-service";
import logger from "../utils/logger";
import axios from "axios";

interface VideoTranscriptMap {
    videoUrl: string,
    transcriptUrl: string


}

interface McqQuestions {
    questions: {
        question: string,
        options: {
            A: string,
            B: string,
            C: string,
            D: string
        },
        correct_option: string,
        explanation: string
    }[]
}

export class ProjectService {
    static async createProject({ userId, title, description }: { userId: string, title: string, description: string }): Promise<string> {
        try {
            logger.info(`Creating project for user: ${userId}`);
            const project = await prismaClient.project.create({
                data: { title, userId, description }
            });
            logger.info(`Project created successfully with ID: ${project.id}`);
            return project.id;
        } catch (error) {
            logger.error(`Error creating project for userId: ${userId}`, error);
            throw error;
        }
    }

    static async getProjectsByUserId({ userId }: { userId: string }) {
        try {
            logger.info(`Fetching projects for user: ${userId}`);
            const projects = await prismaClient.project.findMany({
                where: { userId },
                select: { userId: true, title: true, createdAt: true, id: true, status: true }
            });
            logger.info(`Fetched ${projects.length} projects for user: ${userId}`);
            return projects;
        } catch (error) {
            logger.error(`Error fetching projects for userId: ${userId}`, error);
            throw error;
        }
    }

    static async updateProjectStatus(projectId: string, status: string) {
        try {
            logger.info(`Updating status for project: ${projectId} to ${status}`);
            const projectExists = await prismaClient.project.findFirst({ where: { id: projectId } });
            if (!projectExists) {
                logger.warn(`Project not found for id: ${projectId}`);
                throw new Error(`Project not found for id: ${projectId}`);
            }
            await prismaClient.project.update({ where: { id: projectId }, data: { status } });
            logger.info(`Project status updated successfully for project: ${projectId}`);
        } catch (error) {
            logger.error(`Error updating project status for id: ${projectId}`, error);
            throw error;
        }
    }

    static async getProjectDetailsFromS3({ userId, projectId }: { userId: string, projectId: string }) {
        try {
            logger.debug(`Fetching project details from S3 for user: ${userId}, project: ${projectId}`);
            const videoUrls = await S3Service.getProjectFileUrl({ userData: { userId, projectId } });
            logger.info(`Successfully fetched project details from S3 for project: ${projectId}`);
            return videoUrls;
        } catch (error) {
            logger.error(`Error fetching project details from S3 for project: ${projectId}`, error);
            throw new Error(`Unable to fetch project details from S3 for userId: ${userId}, projectId: ${projectId}`);
        }
    }

    static async deleteProject({ userId, projectId }: { userId: string, projectId: string }) {
        try {
            logger.info(`Attempting to delete project: ${projectId} for user: ${userId}`);
            await prismaClient.$transaction(async (tx) => {
                const projectExist = await tx.project.findUnique({ where: { userId, id: projectId } });
                if (!projectExist) {
                    logger.warn(`Project not found for deletion: ${projectId}`);
                    throw new Error(`Project not found for userId: ${userId}, projectId: ${projectId}`);
                }
                await tx.videoMetadata.deleteMany({
                    where: { videoId: { in: (await tx.video.findMany({ where: { projectId }, select: { id: true } })).map(v => v.id) } }
                });
                await tx.video.deleteMany({ where: { projectId } });
                await tx.projectMetaData.deleteMany({ where: { projectId } });
                await tx.project.delete({ where: { id: projectId } });
            });
            await S3Service.deleteProjectFiles({ userData: { userId, projectId } });
            logger.info(`Project deleted successfully: ${projectId}`);
        } catch (error) {
            logger.error(`Error deleting project for userId: ${userId}, projectId: ${projectId}`, error);
            throw new Error(`Unable to delete project for userId: ${userId}, projectId: ${projectId}`);
        }
    }


    static async addProjectMetaData({ projectId, generate_translate, languages, generate_subtitle, generate_transcript, gender }: { projectId: string, generate_translate: boolean, languages: string[], generate_subtitle: boolean, generate_transcript: boolean, gender: string }) {
        try {
            const metaData = await prismaClient.projectMetaData.create({
                data: {
                    projectId: projectId,
                    languages,
                    generate_translate,
                    generate_subtitle,
                    generate_transcript,
                    gender
                }
            })

            return metaData;
        } catch (error) {
            console.error("Error updating project metadata:", error);
            throw error;
        }

    }
    static async getSpecificLanguageContent({ userId, projectId, language }: { userId: string, projectId: string, language: string }) {
        try {
            const videoUrls = await S3Service.getFilesForSpecificLanguage({ userId, projectId, language });
            return videoUrls;

        } catch (error) {

            console.error('Error fetching specific language content from S3:', error);
            throw new Error(`Unable to fetch specific language content from S3 for user data userId ; ${userId}  projectId ${projectId} and language ${language} `);

        }
    }

    static async getProjectDetails({ projectId, userId }: { projectId: string, userId: string }) {
        try {
            const projectDetails = await prismaClient.project.findUnique({
                where: {
                    id: projectId,
                    userId: userId
                },
                select: {
                    userId: true,
                    title: true,
                    createdAt: true,
                    id: true,
                    status: true,
                    projectMetaData: true
                }
            })

            if (!projectDetails || !projectDetails.projectMetaData) {
                throw new Error(`Project not found for userId: ${userId}, projectId: ${projectId}`);
            }
            return {
                userId: projectDetails.userId,
                title: projectDetails.title,
                createdAt: projectDetails.createdAt,
                id: projectDetails.id,
                status: projectDetails.status,
                projectMetaData: projectDetails.projectMetaData
            };
        } catch (error) {
            console.error("Error fetching project details:", error);
            throw error;
        }


    }

    static async getProjectOriginalContent({ projectId, userId }: { projectId: string, userId: string }) {

        try {

            console.log("this is project id", projectId)
            const projectDetails = await prismaClient.project.findFirst({
                where: { id: projectId, userId: userId },
                select: {
                    videos: {
                        select: { videoMetaData: true },
                        orderBy: { position: 'asc' }
                    }
                }
            })

            console.log("this is project details")
            console.log(projectDetails)

            const videoTranscriptMap: VideoTranscriptMap[] = []

            if (!projectDetails || !projectDetails.videos || projectDetails.videos.length === 0) {
                return []
            }
            for (const video of projectDetails.videos) {
                const videoKey = `${userId}/${projectId}/original_content/videos/${video.videoMetaData?.fileName}`
                const videoUrl = await S3Service.getPresignedUrl({ bucket: process.env.VIDEO_BUCKET_NAME!, key: videoKey })
                const jsonFileName = video.videoMetaData?.fileName.replace(/\.mp4$/, ".mp4.json");
                const transcriptKey = `${userId}/${projectId}/original_content/transcripts/${jsonFileName}`
                const transcriptUrl = await S3Service.getPresignedUrl({ bucket: process.env.VIDEO_BUCKET_NAME!, key: transcriptKey })
                videoTranscriptMap.push({ videoUrl, transcriptUrl })

            }
            return videoTranscriptMap;
        } catch (error) {
            console.error('Error fetching project original content from S3:', error);
            throw new Error(`Unable to fetch project original content from S3 for user data userId ; ${userId}  projectId ${projectId} `);
        }

    }

    static async getProjectContentForDifferentLanguages({ projectId, userId, languageName }: { projectId: string, userId: string, languageName: string }) {
        try {
            const projectDetails = await prismaClient.project.findFirst({
                where: { id: projectId, userId: userId },
                select: {
                    videos: {
                        select: { videoMetaData: true },
                        orderBy: { position: 'asc' }
                    }
                }
            })
            const videoTranscriptMap: VideoTranscriptMap[] = []
            if (!projectDetails || !projectDetails.videos || projectDetails.videos.length === 0) {
                return []
            }
            for (const video of projectDetails.videos) {
                const videoKey = `${userId}/${projectId}/processed/${languageName}/videos/${video.videoMetaData?.fileName}`
                const videoUrl = await S3Service.getPresignedUrl({ bucket: process.env.VIDEO_BUCKET_NAME!, key: videoKey })
                const jsonFileName = video.videoMetaData?.fileName.replace(/\.mp4$/, ".mp4.json");
                const transcriptKey = `${userId}/${projectId}/processed/${languageName}/transcripts/${jsonFileName}`
                const transcriptUrl = await S3Service.getPresignedUrl({ bucket: process.env.VIDEO_BUCKET_NAME!, key: transcriptKey })
                videoTranscriptMap.push({ videoUrl, transcriptUrl })
            }
            return videoTranscriptMap;
        } catch (error) {
            console.error('Error fetching project original content from S3:', error);
            throw new Error(`Unable to fetch project original content from S3 for user data userId ; ${userId}  projectId ${projectId} `);
        }

    }

    static async getGetMcqQuestions({ projectId, userId }: { projectId: string, userId: string }): Promise<McqQuestions> {
        try {
            logger.info(`Fetching mcq questions for project: ${projectId} for user: ${userId}`);
            if (process.env.NODE_ENV == 'development') {
                await new Promise(resolve => setTimeout(resolve, 2000));
                return sampleData;
            }
            const data = await axios.post(`${process.env.MCQ_SERVICE_URL}`, { projectId, userId });
            return data.data;

        } catch (error) {
            console.error('Error getting mcq questions:', error);
            throw new Error('Failed to get mcq questions');
        }
    }

    static async uploadPojectThumbnail({ userId, projectId, thumbnail }: { userId: string, projectId: string, thumbnail: File }) {
        try {
            logger.info(`Uploading thumbnail for project: ${projectId} for user: ${userId}`);
            const result = await S3Service.uploadProjectThumbnail({ userId, projectId, thumbnail });
            return result;
        } catch (error) {
            logger.error(`Error uploading project thumbnail for project: ${projectId} for user: ${userId}`, error);
            throw new Error('Failed to upload project thumbnail');
        }
    }

}



const sampleData = {
    "questions": [
        {
            "question": "What do switches and routers do?",
            "options": {
                "A": "They help you surf the internet",
                "B": "They control traffic flow in a network",
                "C": "They connect devices to the internet",
                "D": "They provide public IP addresses"
            },
            "correct_option": "B",
            "explanation": "Routers and switches are used to manage traffic flow in a network, allowing devices to communicate with each other."
        },
        {
            "question": "What can a router do instead of a switch?",
            "options": {
                "A": "It can assign public IP addresses",
                "B": "It can connect devices to the internet",
                "C": "It can manage traffic flow in a network",
                "D": "It can provide modem services"
            },
            "correct_option": "A",
            "explanation": "A router can assign public IP addresses to devices on your network, whereas a switch only connects devices together."
        },
        {
            "question": "What type of internet connection does a router use?",
            "options": {
                "A": "Cable",
                "B": "DSL",
                "C": "Fiber Optic",
                "D": "Satellite"
            },
            "correct_option": "B",
            "explanation": "A router typically uses DSL or cable internet connections to connect devices to the internet."
        },
        {
            "question": "What is used in small organizations or homes?",
            "options": {
                "A": "Class A IP addresses",
                "B": "Class B IP addresses",
                "C": "Class C IP addresses",
                "D": "Public IP addresses"
            },
            "correct_option": "C",
            "explanation": "Class C IP addresses are used in small organizations or homes, and are the most commonly used IP address range."
        },
        {
            "question": "Who assigns public IP addresses?",
            "options": {
                "A": "Router",
                "B": "Switch",
                "C": "Modem",
                "D": "Techie people"
            },
            "correct_option": "C",
            "explanation": "The modem or router in your home or business is typically responsible for assigning public IP addresses."
        },
        {
            "question": "What is an IP address?",
            "options": {
                "A": "An identifier for a computer on the internet",
                "B": "A type of network cable",
                "C": "A device that connects computers to the internet",
                "D": "A type of modem"
            },
            "correct_option": "A",
            "explanation": "An IP address is an identifier for a computer or device on the internet."
        },
        {
            "question": "What do computers use to share information?",
            "options": {
                "A": "Network cables",
                "B": "Internet connections",
                "C": "IP addresses",
                "D": "Public IP addresses"
            },
            "correct_option": "C",
            "explanation": "Computers use IP addresses to share information with each other."
        },
        {
            "question": "What is a public IP address?",
            "options": {
                "A": "An identifier for a computer on the internet",
                "B": "A type of network cable",
                "C": "A device that connects computers to the internet",
                "D": "A unique number assigned by a router"
            },
            "correct_option": "A",
            "explanation": "A public IP address is an identifier for a computer or device on the internet."
        },
        {
            "question": "Why do devices need IP addresses?",
            "options": {
                "A": "To connect to the internet",
                "B": "To share information with each other",
                "C": "To provide modem services",
                "D": "To manage traffic flow in a network"
            },
            "correct_option": "B",
            "explanation": "Devices need IP addresses so they can share information with each other."
        },
        {
            "question": "What is the device that provides modem services?",
            "options": {
                "A": "Router",
                "B": "Switch",
                "C": "Modem",
                "D": "Network cable"
            },
            "correct_option": "C",
            "explanation": "The device that provides modem services is typically a modem, which connects devices to the internet."
        }
    ]
}