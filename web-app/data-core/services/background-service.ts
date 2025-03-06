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
            const response = await axios.post(process.env.VIDEO_PROCESSOR_URL!, {
                userId, projectId, projectMetaData
            });

            if (response.status != 200 || response.data.projectId != projectId || response.data.received != true) {
                console.log('Failed to initiate background process , marking the project status to FAILED');
                await ProjectService.updateProjectStatus(projectId, 'FAILED')
            }
            return true
        } catch (error) {
            console.error('Failed to initiate background process', error);
            throw new Error('Failed to initiate background process');
        }
    }
}