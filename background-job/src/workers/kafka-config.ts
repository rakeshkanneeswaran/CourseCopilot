import { Kafka } from "kafkajs";

const kafka_consumer = new Kafka({
    clientId: "video-processor-consumer",
    brokers: ["localhost:9092"]
})
const kafka_admin = new Kafka({
    clientId: "video-processor-admin",
    brokers: ["localhost:9092"]
})
export { kafka_admin, kafka_consumer }

