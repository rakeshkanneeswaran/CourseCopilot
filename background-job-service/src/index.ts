import dotenv from "dotenv";
dotenv.config();
import kafkaClient from "./utils/kafka-config";
import Fastify from "fastify";
import axios from "axios";
import { ProjectEmbeddingRequest, UpdateProjectStatus } from "@course-copilot/shared-types";
import { transformRequestFromWebApp } from "./utils";
import { KafkaService } from "./services/kafka-service";

// Validate required environment variables
const requiredEnvVars = [
    "KAFKA_CLIENT_ID",
    "KAFKA_BROKER",
    "KAFKA_GROUP_ID_PROCESS_PROJECT",
    "KAFKA_GROUP_ID_PROCESS_EMBEDDING",
    "VIDEO_PROCESSOR_URL",
    "WEB_APP_URL",
];

for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
    }
}

// Initialize Fastify and Kafka
const fastify = Fastify({ logger: true });

// Kafka consumers
const processProjectConsumer = kafkaClient.consumer({
    groupId: "background-job-service-process-project",
});
const processEmbeddingConsumer = kafkaClient.consumer({
    groupId: "background-job-service-process-embedding",
});
const processVideoConsumer = kafkaClient.consumer({
    groupId: "background-job-service-process-video",
});

// Function to run the process-project consumer
async function runProcessProjectConsumer() {
    try {
        await processProjectConsumer.connect();
        await processProjectConsumer.subscribe({
            topic: "process-project",
            fromBeginning: false,
        });

        await processProjectConsumer.run({
            eachMessage: async ({ message }) => {
                try {
                    const parsedData = JSON.parse(message.value!.toString());
                    fastify.log.info("Received data from web app: %o", parsedData);

                    const dataToVideoProcessor = transformRequestFromWebApp(parsedData);
                    fastify.log.info("Sending request to video processor: %o", dataToVideoProcessor);
                    await KafkaService.sendMessageToKafka("process-video", JSON.stringify(dataToVideoProcessor));
                } catch (error) {
                    console.log("Error sending request to video processor", error);
                }
            },
        });

        console.log("processProjectConsumer running ✅");
    } catch (error) {
        console.error("Error in processProjectConsumer:", error);
        process.exit(1);
    }
}

// Function to run the process-video consumer
async function runProcessVideoConsumer() {
    try {
        await processVideoConsumer.connect();
        await processVideoConsumer.subscribe({
            topic: "process-video-update",
            fromBeginning: false,
        });

        await processVideoConsumer.run({
            eachMessage: async ({ message }) => {
                try {
                    const data = JSON.parse(message.value!.toString());
                    console.log(`Received request for userId: ${data.userId}, projectId: ${data.projectId} from ${data.serviceName} with message: ${data.message}`);

                    if (data.status !== 200) {
                        const payloadToWebApp: UpdateProjectStatus = {
                            eventType: "UPDATE PROJECT STATUS",
                            timestamp: new Date().toISOString(),
                            serviceName: "background-job",
                            message: "Project process failed at video processing",
                            projectMetaData: {
                                userId: data.userId,
                                projectId: data.projectId,
                                projectStatus: "FAILED",
                            },
                        };

                        await axios.post(process.env.WEB_APP_URL!, payloadToWebApp);
                        fastify.log.info("Project status updated to FAILED");
                    }

                    const dataForEmbeddingService: ProjectEmbeddingRequest = {
                        message: "Request to embedding service from background-job",
                        eventType: "PROCESS EMBEDDING",
                        timestamp: new Date().toISOString(),
                        serviceName: "background-job",
                        projectMetaData: {
                            projectId: data.projectId,
                            userId: data.userId,
                        },
                    };

                    await KafkaService.sendMessageToKafka("process-embedding", JSON.stringify(dataForEmbeddingService));
                } catch (error) {
                    fastify.log.error("Error updating video process: %o", error);
                }
            },
        });

        console.log("processVideoConsumer running ✅");
    } catch (error) {
        console.error("Error in processVideoConsumer:", error);
        process.exit(1);
    }
}

// Function to run the process-embedding consumer
async function runProcessEmbeddingConsumer() {
    try {
        await processEmbeddingConsumer.connect();
        await processEmbeddingConsumer.subscribe({
            topic: "process-embedding-update",
            fromBeginning: false,
        });

        await processEmbeddingConsumer.run({
            eachMessage: async ({ message }) => {
                try {
                    const data = JSON.parse(message.value!.toString());
                    console.log("Received data from embedding service: %o", data);

                    const payloadToWebApp: UpdateProjectStatus = {
                        eventType: "UPDATE PROJECT STATUS",
                        timestamp: new Date().toISOString(),
                        serviceName: "background-job",
                        message: data.processStatus === "COMPLETED" ? "Project process completed" : "Project process failed at embedding service",
                        projectMetaData: {
                            userId: data.userId,
                            projectId: data.projectId,
                            projectStatus: data.processStatus === "COMPLETED" ? "COMPLETED" : "FAILED",
                        },
                    };
                    console.log("Sending payload to web app: %o", payloadToWebApp);
                    await axios.post(process.env.WEB_APP_URL!, payloadToWebApp);
                    fastify.log.info("Project process status updated");
                } catch (error) {
                    fastify.log.error("Error processing embedding message: %o", error);
                }
            },
        });

        console.log("processEmbeddingConsumer running ✅");
    } catch (error) {
        console.error("Error in processEmbeddingConsumer:", error);
        process.exit(1);
    }
}

// Main function to start all consumers
async function runConsumers() {
    try {
        await KafkaService.createTopics([
            "process-project",
            "process-embedding",
            "process-embedding-update",
            "process-video",
            "process-video-update",
        ]);

        // Run all consumers concurrently
        await Promise.all([
            runProcessVideoConsumer(),
            runProcessProjectConsumer(),
            runProcessEmbeddingConsumer(),
        ]);

        console.log("All Kafka consumers are running ✅");
    } catch (error) {
        console.log("Error starting Kafka consumers: %o", error);
        process.exit(1);
    }
}

runConsumers();