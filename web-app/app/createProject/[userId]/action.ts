"use server"
import { ProjectService } from "@/data-core/services/project-service"

export async function createProject({ userId, title, description }: { userId: string, title: string, description: string }) {
    try {
        const projectId = await ProjectService.createProject({ userId, title, description })
        return projectId
    } catch (error) {
        console.error('Error creating project:', error);
        throw Error("Error creating project")
    }
}