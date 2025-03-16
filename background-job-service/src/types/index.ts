
export interface ProcessProjectRequest {
    userId: string;
    projectId: string;
    projectMetaData: {
        generate_translate: boolean;
        generate_subtitle: boolean;
        languages: string[];
        generate_transcript: boolean
    }
    serviceName: string,
    message: string
}

export interface ProcessVideoReponse {
    received: boolean;
    projectId: string
    userId: string,
    projectMetaData: {
        generate_translate: boolean;
        generate_subtitle: boolean;
        languages: string[];
        generate_transcript: boolean
    }
    status: number,
    serviceName: string,
    message: string
}


export interface UpdateProjectVideoStatusRequest {
    projectId: string;
    status: number;
    userId: string
    serviceName: string,
    message: string,
}



export interface UpdateVectorStoreRequest {
    projectId: string;
    processStatus: string;
    message: string
    userId: string
    serviceName: string,
}


