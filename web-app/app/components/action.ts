'use server'

import { ProjectService } from "@/data-core/services/project-service"

export async function deleteProject({ userId, projectId }: { userId: string; projectId: string }) {
    try {
        return await ProjectService.deleteProject({ userId, projectId })
    } catch (error) {
        throw error
    }

}

export async function addParticipantToProject({ projectId, emailId }: { projectId: string; emailId: string }): Promise<boolean> {
    try {
        return await ProjectService.addParticipantToProject({ projectId, emailId })
    } catch (error) {
        throw error
    }
}