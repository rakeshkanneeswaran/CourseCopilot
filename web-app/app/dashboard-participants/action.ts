"use server"
import { ProjectService } from "@/data-core/services/project-service"
export async function getProjectDetails({ participantId }: { participantId: string }) {
    try {
        const projects = await ProjectService.getProjectByParticipantId({ participantId });
        return projects;
    } catch (error) {
        throw error;
    }

}
