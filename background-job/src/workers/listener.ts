import { kafka_consumer } from "./kafka-config";
import { ProcessProjectRequest } from "../types";
import axios from "axios";

const consumer = kafka_consumer.consumer({ groupId: "process-video-listener" });

async function listener() {
    try {
        console.log(`🟡 Initializing Kafka listener...`);

        await consumer.connect();
        console.log(`✅ Successfully connected to Kafka server.`);

        await consumer.subscribe({
            topic: "process-video",
            fromBeginning: true,
        });
        console.log(`✅ Successfully subscribed to "process-video" topic.`);

        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                try {
                    console.log(`🟡 Message received on topic: ${topic}, partition: ${partition}`);

                    const payload: ProcessProjectRequest = JSON.parse(message.value.toString());
                    console.log(`📤 Sending project details to intelligence server for processing...`);

                    const response = await axios.post("http://localhost:3003/process/video", payload);

                    if (response.status !== 200) {
                        console.error(`❌ Error processing project: ${payload.projectId}`);
                        console.log("🟡 Intelligence server refused to process the project details.");
                    } else {
                        console.log(`✅ Successfully processed project: ${payload.projectId}`);
                    }
                } catch (error) {
                    console.error(`❌ Failed to process message:`, error);
                }
            },
        });

    } catch (error) {
        console.error("❌ Error initializing Kafka listener:", error);
    }
}

// Start the Kafka consumer
listener().catch(console.error);
