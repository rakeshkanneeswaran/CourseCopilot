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
export interface ProcessVideoResponse {
    eventType: string;
    timestamp: string;
    serviceName: string;
    received: boolean;
    status: number;
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
export interface RequestToVideoProcessor {
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
export interface UpdateProjectVideoStatusRequest {
    eventType: string;
    timestamp: string;
    serviceName: string;
    status: number;
    message: string;
    projectMetaData: {
        userId: string;
        projectId: string;
    };
}
export interface UpdateVectorStoreRequest {
    eventType: string;
    timestamp: string;
    serviceName: string;
    status: number;
    message: string;
    projectMetaData: {
        userId: string;
        projectId: string;
        projectStatus: string;
    };
}
