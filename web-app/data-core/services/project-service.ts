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
}