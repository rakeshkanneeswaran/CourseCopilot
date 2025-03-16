import dotenv from "dotenv";
import Fastify from "fastify";
import { ProcessVideoReponse, UpdateProjectVideoStatusRequest, UpdateVectorStoreRequest } from "./types";
import { ProcessProjectRequest, ProjectEmbeddingRequest, UpdateProjectStatus } from "@course-copilot/shared-types";
import axios from "axios";
import { transformRequestFromWebApp } from "./utils";
dotenv.config();

const fastify = Fastify();


fastify.get("/healthz", async (request, reply) => {
    return { status: "ok" };
})


fastify.post("/project/process", async (request, reply) => {
    try {
        const data = request.body as ProcessProjectRequest;
        console.log(
            `Received request from service: '${data.serviceName}' with message: '${data.message}' at ${data.timestamp}`
        );
        const dataToVideoProcessor = transformRequestFromWebApp(data);
        console.log("Sending request to video processor with data", dataToVideoProcessor);
        const requestToVideoProcessor = await axios.post(process.env.VIDEO_PROCESSOR_URL!, dataToVideoProcessor);
        const responseFromVideoProcessor = requestToVideoProcessor.data as ProcessVideoReponse;
        if (responseFromVideoProcessor.received) {
            return {
                received: true,
                projectId: responseFromVideoProcessor.projectId,
                userId: responseFromVideoProcessor.userId,
                projectMetaData: responseFromVideoProcessor.projectMetaData,
                status: 200,
            };
        }
        return {
            received: false,
            projectId: responseFromVideoProcessor.projectId,
            userId: responseFromVideoProcessor.userId,
            projectMetaData: responseFromVideoProcessor.projectMetaData,
            status: 400,
        };
    } catch (error) {
        console.log(error);
        throw error;
    }

});


fastify.post("/project/update/process-video", async (request, reply) => {
    try {
        const data = request.body as UpdateProjectVideoStatusRequest
        console.log(`Received request for userId : ${data.userId} projectId : ${data.projectId} from ${data.serviceName} with message ${data.message}`);
        if (data.status !== 200) {
            const payloadToWebApp: UpdateProjectStatus = {
                eventType: 'UPDATE PROJECT STATUS',
                timestamp: new Date().toISOString(),
                serviceName: 'background-job',
                message: "Project process failed at video processing",
                projectMetaData: {
                    userId: data.userId,
                    projectId: data.projectId,
                    projectStatus: 'FAILED'
                }
            }
            const requestToWebApp = await axios.post(process.env.WEB_APP_URL!, payloadToWebApp);
            if (requestToWebApp.status === 200) {
                console.log('Project status updated');
            }
        }
        console.log("trying to send request to embedding service with data", data);
        const dataForEmbeddingService: ProjectEmbeddingRequest = {
            message: "Request to embedding service from background-job",
            eventType: "PROCESS EMBEDDING",
            timestamp: new Date().toISOString(),
            serviceName: "background-job",
            projectMetaData: {
                projectId: data.projectId,
                userId: data.userId,
            }

        }
        const requestToEmbeddingService = await axios.post(process.env.EMBEDDING_SERVICE_URL!, dataForEmbeddingService);
        if (requestToEmbeddingService.status === 200) {
            console.log("Request accepted by embedding service for project", JSON.stringify({
                projectId: data.projectId,
                status: data.userId
            }));
        }
        else {
            throw new Error("background-job is unable to send request to embedding service")
        }
    } catch (error) {
        console.log(error)
        throw error
    }
})

fastify.post("/update/vectorstore/", async (request, reply) => {

    try {
        const data = request.body as UpdateVectorStoreRequest
        console.log(data)
        if (data.processStatus == 'COMPLETED') {
            const payloadToWebApp: UpdateProjectStatus = {
                eventType: 'UPDATE PROJECT STATUS',
                timestamp: new Date().toISOString(),
                serviceName: 'background-job',
                message: "Project process completed",
                projectMetaData: {
                    userId: data.userId,
                    projectId: data.projectId,
                    projectStatus: 'COMPLETED'
                }
            }
            const requestToWebApp = await axios.post(process.env.WEB_APP_URL!, payloadToWebApp);
            if (requestToWebApp.status === 200) {
                console.log('Project process status updated');
            }
        }
        else {
            const payloadToWebApp: UpdateProjectStatus = {
                eventType: 'UPDATE PROJECT STATUS',
                timestamp: new Date().toISOString(),
                serviceName: 'background-job',
                message: "Project process failed at embedding service",
                projectMetaData: {
                    userId: data.userId,
                    projectId: data.projectId,
                    projectStatus: 'FAILED'
                }
            }
            const requestToWebApp = await axios.post(process.env.WEB_APP_URL!, payloadToWebApp);
            if (requestToWebApp.status === 200) {
                console.log('Project process status updated');
            }
        }

    } catch (error) {
        console.log(error)
        throw error

    }


})

const start = async () => {
    try {
        await fastify.listen({ port: 3001, host: "0.0.0.0" });
        console.log("🚀 Server is running on http://0.0.0.0:3001");
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};


start();
