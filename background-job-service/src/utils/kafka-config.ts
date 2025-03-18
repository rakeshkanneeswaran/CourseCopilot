import { Kafka } from "kafkajs";
const kafkaClient = new Kafka({
    clientId: "my-app",
    brokers: [process.env.KAFKA_BROKER!]
})

export default kafkaClient;