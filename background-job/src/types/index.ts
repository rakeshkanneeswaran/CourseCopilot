
export interface ProcessProjectRequest {
    userId: string;
    projectId: string;
    projectMetaData: {
        generate_translate: boolean;
        generate_subtitle: boolean;
        languages: string[];
        generate_transcript: boolean
    }
}