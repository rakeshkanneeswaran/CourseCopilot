'use server'

import { ProjectService } from "@/data-core/services/project-service"

export async function deleteProject({ userId, projectId }: { userId: string; projectId: string }) {
    try {
        return await ProjectService.deleteProject({ userId, projectId })
    } catch (error) {
        throw error
    }

}