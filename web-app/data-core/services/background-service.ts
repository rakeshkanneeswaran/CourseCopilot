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
            console.log("this is the value of process.env.VIDEO_PROCESSOR_URL", process.env.VIDEO_PROCESSOR_URL)
            console.log("this is the data that is sent", { userId, projectId, projectMetaData, serviceName: "WebApp", message: "process video" })
            const response = await axios.post(process.env.VIDEO_PROCESSOR_URL!, {
                userId, projectId, projectMetaData, serviceName: "WebApp", message: "process video"
            });

            console.log(response.data)



            if (response.data.status != 200 || response.data.received != true) {
                console.log('Failed to initiate background process , marking the project status to FAILED');
                await ProjectService.updateProjectStatus(projectId, 'FAILED')
            }
            return true
        } catch (error) {
            console.log('Failed to initiate background process', error);
            await ProjectService.deleteProject({ userId, projectId })
            throw new Error('Failed to initiate background process');
        }
    }
}