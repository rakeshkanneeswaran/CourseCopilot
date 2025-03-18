import { ProjectService } from "./project-service";
import { KafkaService } from "./kafka-service";
import logger from "../utils/logger";
import { ProcessProjectRequest } from "@course-copilot/shared-types";

interface ProjectMetaData {
    generate_translate: boolean;
    generate_subtitle: boolean;
    languages: string[];
    generate_transcript: boolean;
    gender: string;
}



export class BackgroundService {
    static async initiateBackground({ userId, projectId, projectMetaData }: { userId: string, projectId: string, projectMetaData: ProjectMetaData }) {
        try {
            logger.debug('Initiating background process for project:', projectId);
            await ProjectService.updateProjectStatus(projectId, 'IN_PROGRESS')
            await ProjectService.addProjectMetaData({ projectId, ...projectMetaData })


            logger.debug('sending request to background-job to process videos', projectId);
            console.log("this is video processing ur", process.env.BACKGROUND_JOB_URL!)

            const payload: ProcessProjectRequest = {
                eventType: "PROCESS_PROJECT",
                timestamp: new Date().toISOString(),
                serviceName: "WebApp",
                message: "process video request from webapp",
                projectMetaData: {
                    userId,
                    projectId,
                    ...projectMetaData
                }
            }
            const resposne = await KafkaService.sendMessageToKafka('process-project', JSON.stringify(payload))
            return resposne
        } catch (error) {
            logger.error('Failed to initiate background process', error);
            await ProjectService.deleteProject({ userId, projectId })
            throw new Error('Failed to initiate background process');
        }
    }


}