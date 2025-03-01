"use server"
import { ProjectService } from "@/data-core/services/project-service"
export async function getProjectDetails({ userId }: { userId: string }) {

    try {
        const projects = await ProjectService.getProjectsByUserId({ userId });
        return projects;

    } catch (error) {

        throw error;
    }

}