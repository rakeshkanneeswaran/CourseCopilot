import { KafkaService } from "./kafka-service";
interface ProjectMetaData {
    generate_translate: boolean;
    generate_subtitle: boolean;
    languages: string[];
    generate_transcript: boolean;
}



export class BackgroundService {
    static async initiateBackground({ userId, projectId, projectMetaData }: { userId: string, projectId: string, projectMetaData: ProjectMetaData }) {
        try {
            const result = await KafkaService.sendMessageToKafka(process.env.KAFKA_TOPIC!, JSON.stringify({ userId, projectId, projectMetaData }))
            return result
        } catch (error) {
            console.error('Error sending message to kafka:', error);
            throw new Error('Failed to initiate background process');
        }
    }
}