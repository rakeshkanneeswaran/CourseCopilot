import { ProcessProjectRequest } from "@course-copilot/shared-types";
export function transformRequestFromWebApp(data: ProcessProjectRequest) {
    const { userId, projectId, generate_translate, generate_subtitle, languages, generate_transcript } = data.projectMetaData;
    return {
        userId,
        projectId,
        projectMetaData: {
            generate_translate,
            generate_subtitle,
            languages,
            generate_transcript
        },
        serviceName: "background job service",
        message: "requesting to process video"
    };
}

export function transformRequestFromVideoProcessor(data: ProcessProjectRequest) {

    const transformedData = {
        userId: data.projectMetaData.userId,
        projectId: data.projectMetaData.projectId,
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