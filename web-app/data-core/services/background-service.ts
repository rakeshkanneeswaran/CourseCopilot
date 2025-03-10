import { ProjectService } from "./project-service";
import axios from "axios";
import logger from "../utils/logger";

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
            const response = await axios.post(process.env.VIDEO_PROCESSOR_URL!, {
                userId, projectId, projectMetaData, serviceName: "WebApp", message: "process video"
            });

            if (response.data.status != 200 || response.data.received != true) {
                logger.error('Failed to initiate background process , marking the project status to FAILED');
                await ProjectService.updateProjectStatus(projectId, 'FAILED')
            }
            return true
        } catch (error) {
            logger.error('Failed to initiate background process', error);
            await ProjectService.deleteProject({ userId, projectId })
            throw new Error('Failed to initiate background process');
        }
    }


}