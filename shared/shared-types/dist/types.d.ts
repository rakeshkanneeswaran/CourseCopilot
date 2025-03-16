export interface ProcessProjectRequest {
    eventType: string;
    timestamp: string;
    serviceName: string;
    message: string;
    projectMetaData: {
        userId: string;
        projectId: string;
        generate_translate: boolean;
        generate_subtitle: boolean;
        languages: string[];
        generate_transcript: boolean;
    };
}
export interface ProjectEmbeddingRequest {
    eventType: string;
    timestamp: string;
    serviceName: string;
    message: string;
    projectMetaData: {
        userId: string;
        projectId: string;
    };
}
