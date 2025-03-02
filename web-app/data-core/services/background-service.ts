import { KafkaService } from "./kafka-service";
import { ProjectService } from "./project-service";
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
            const result = await KafkaService.sendMessageToKafka(process.env.KAFKA_TOPIC!, JSON.stringify({ userId, projectId, projectMetaData }))
            await ProjectService.updateProjectStatus(projectId, 'IN_PROGRESS')
            await ProjectService.addProjectMetaData({ projectId, ...projectMetaData })
            return result
        } catch (error) {
            console.error('Error sending message to kafka:', error);
            throw new Error('Failed to initiate background process');
        }
    }
}