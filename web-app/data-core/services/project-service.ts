import prismaClient from "@/data-core/database";
import { S3Service } from "./aws/s3-service";
export class ProjectService {
    static async createProject({ userId, title, description }: { userId: string, title: string, description: string }): Promise<string> {
        try {
            const project = await prismaClient.project.create({
                data: {
                    title,
                    userId,
                    description
                }
            })
            return project.id;
        } catch (error) {
            throw error;
        }
    }
    static async getProjectsByUserId({ userId }: { userId: string }): Promise<{
        userId: string;
        title: string;
        createdAt: Date
        id: string;
        status: string;
    }[]> {
        try {
            const projects = await prismaClient.project.findMany({
                where: {
                    userId
                },
                select: {
                    userId: true,
                    title: true,
                    createdAt: true,
                    id: true,
                    status: true
                }
            })
            console.log("Projects:", projects);
            return projects;
        } catch (error) {
            throw error;
        }
    }

    static async updateProjectStatus(projectId: string, status: string) {
        try {
            await prismaClient.project.update({
                where: { id: projectId },
                data: { status: status },
            })
        } catch (error) {
            throw error;
        }
    }

    static async getProjectDetailsFromS3({ userId, projectId }: { userId: string, projectId: string }) {
        try {
            const userData = {
                userId,
                projectId
            }
            const videoUrls = await S3Service.getProjectFileUrl({ userData });
            return videoUrls;
        } catch (error) {

            console.error('Error fetching project details from S3:', error);
            throw new Error(`Unable to fetch project details from S3 for user data userId ; ${userId}  projectId ${projectId} `);
        }
    }

    static async deleteProject({ userId, projectId }: { userId: string, projectId: string }) {
        try {
            await prismaClient.$transaction(async (tx) => {
                // Check if the project exists
                const projectExist = await tx.project.findUnique({
                    where: { userId, id: projectId }
                });
                if (!projectExist) {
                    throw new Error(`Project not found for userId: ${userId}, projectId: ${projectId}`);
                }

                // Delete VideoMetadata first (depends on Video)
                await tx.videoMetadata.deleteMany({
                    where: {
                        videoId: {
                            in: (await tx.video.findMany({
                                where: { projectId },
                                select: { id: true }
                            })).map(v => v.id)
                        }
                    }
                });

                // Delete Videos (depends on Project)
                await tx.video.deleteMany({
                    where: { projectId }
                });


                await tx.projectMetaData.delete({
                    where: { projectId }
                })

                // Delete Project last
                await tx.project.delete({
                    where: { id: projectId }
                });
            });

            // Delete project files from S3 (outside transaction)
            await S3Service.deleteProjectFiles({ userData: { userId, projectId } });

        } catch (error) {
            console.error("Error deleting project:", error);
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

}