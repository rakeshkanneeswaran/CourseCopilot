
import { kafka_consumer } from "./kafka-config";
import { ProcessVideoRequest } from "../types";
const consumer = kafka_consumer.consumer({ groupId: "process-video-listener" });
async function listener() {
    console.log(`🟡 Initializing listener`)
    await consumer.connect();
    console.log(`✅ Successfully connected to kafka server`);
    await consumer.subscribe({
        topic: "process-video", fromBeginning: true
    })
    console.log(`✅ Successfully subscribed process-video topic`);
    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            console.log(`🟡 Message received at ${topic}`)
            // console.log({
            //     offset: message.offset,
            //     value: message?.value?.toString(),
            // })

            const payload = JSON.parse(message.value.toString()) as ProcessVideoRequest;
            console.log(payload)
        },
    })
}
listener();