import prismaClient from "@/data-core/database";
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
        description: string | null;
        id: string;
        status: string;
    }[]> {
        try {
            const projects = await prismaClient.project.findMany({
                where: {
                    userId
                }
            })
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
}