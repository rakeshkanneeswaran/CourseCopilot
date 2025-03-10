import { ProcessProjectRequest } from "../types";
export function transformRequestFromWebApp(data: ProcessProjectRequest) {

    const transformedData = {
        userId: data.userId,
        projectId: data.projectId,
        projectMetaData: {
            generate_translate: data.projectMetaData.generate_translate,
            generate_subtitle: data.projectMetaData.generate_subtitle,
            languages: data.projectMetaData.languages,
            generate_transcript: data.projectMetaData.generate_transcript
        },
        serviceName: "background-job",
        message: "process video"
    }
    return transformedData;
}

export function transformRequestFromVideoProcessor(data: ProcessProjectRequest) {

    const transformedData = {
        userId: data.userId,
        projectId: data.projectId,
        projectMetaData: {
            generate_translate: data.projectMetaData.generate_translate,
            generate_subtitle: data.projectMetaData.generate_subtitle,
            languages: data.projectMetaData.languages,
            generate_transcript: data.projectMetaData.generate_transcript
        },
        serviceName: "background-job",
        message: "process video"
    }
    return transformedData;
}