import { Kafka, RecordMetadata } from "kafkajs";
const kafka = new Kafka({
    clientId: process.env.KAFKA_CLIENT_ID!,
    brokers: [process.env.KAFKA_BROKER!]
})
export class KafkaService {
    static async sendMessageToKafka(topic: string, message: string): Promise<boolean> {
        try {
            const producer = kafka.producer()
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
}