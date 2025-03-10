import dotenv from "dotenv";
import Fastify from "fastify";
import { ProcessProjectRequest, ProcessVideoReponse, UpdateProjectVideoStatusRequest, UpdateVectorStoreRequest } from "./types";
import axios from "axios";
import { transformRequestFromWebApp } from "./utils";
dotenv.config();

const fastify = Fastify();


fastify.post("/project/process", async (request, reply) => {
    try {
        const data = request.body as ProcessProjectRequest;
        console.log(data)
        console.log(`Received request from service: "${data.serviceName}" to perform: "${data.message}"`);
        const dataToVideoProcessor = transformRequestFromWebApp(data);
        console.log("Data to video processor", dataToVideoProcessor);
        const requestToVideoProcessor = await axios.post(process.env.VIDEO_PROCESSOR_URL!, dataToVideoProcessor);
        const responseFromVideoProcessor = requestToVideoProcessor.data as ProcessVideoReponse;
        console.log("Response from video processor", responseFromVideoProcessor);
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
            const requestToWebApp = await axios.post(process.env.WEB_APP_URL!, { projectId: data.projectId, status: "FAILED" });
            if (requestToWebApp.status === 200) {
                console.log('Project status updated');
            }
        }
        console.log("trying to send request to embedding service with data", data);
        const dataForEmbeddingService = {
            userId: data.userId,
            projectId: data.projectId,
            serviceName: "backgournd-job",
            message: "create embedding"

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
        if (data.processStatus !== 'COMPLETED') {
            const requestToWebApp = await axios.post(process.env.WEB_APP_URL!, data);
            if (requestToWebApp.status === 200) {
                console.log('Project status updated');
            }
        }

    } catch (error) {

    }


})

const start = async () => {
    try {
        await fastify.listen({ port: 3001 });
        console.log("🚀 Server is running on http://localhost:3001");
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
