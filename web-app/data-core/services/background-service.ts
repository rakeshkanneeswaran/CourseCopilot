import { ProjectService } from "./project-service";
import axios from "axios";
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
            await ProjectService.updateProjectStatus(projectId, 'IN_PROGRESS')
            await ProjectService.addProjectMetaData({ projectId, ...projectMetaData })
            const response = await axios.post("http://localhost:3002/process-video", {
                userId, projectId, projectMetaData
            });
            if (response.status != 200 || response.data.pojectId != projectId || response.data.received != true) {
                await ProjectService.updateProjectStatus(projectId, 'FAILED')
            }

            return true
        } catch (error) {
            console.error('Error sending message to kafka:', error);
            throw new Error('Failed to initiate background process');
        }
    }
}