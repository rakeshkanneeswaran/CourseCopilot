import { RecordMetadata } from "kafkajs";
import kafkaClient from "../utils/kafka-config";

export class KafkaService {
    static async sendMessageToKafka(topic: string, message: string): Promise<boolean> {
        try {
            const producer = kafkaClient.producer()
            await producer.connect()
            const response: RecordMetadata[] = await producer.send({
                topic: topic,
                messages: [{ value: message }]
            })
            console.log('Message sent to kafka', response)
            await producer.disconnect();
            return true;
        } catch (error) {
            throw error;
        }
    }

    static async createTopics(topics: string[]) {
        try {
            const admin = kafkaClient.admin()
            await admin.connect()
            const exsistingTopics = await admin.listTopics()
            const newTopics = topics.filter(topic => !exsistingTopics.includes(topic))
            if (newTopics.length > 0) {
                for (let topic of newTopics) {
                    console.log('Creating topic', topic)
                    await admin.createTopics({
                        topics: [{ topic }]
                    })
                }
            }
        } catch (error) {
            throw error;
        }
    }
}