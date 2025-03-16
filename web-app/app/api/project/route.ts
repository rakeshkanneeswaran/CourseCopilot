import { NextResponse } from 'next/server';
import { ProjectService } from '@/data-core/services/project-service';
import { UpdateProjectStatus } from '@course-copilot/shared-types';


export async function GET() {
    return NextResponse.json({ message: 'Hello from Next.js API' });
}

export async function POST(req: Request) {
    try {
        const data: UpdateProjectStatus = await req.json();
        console.log(`Received request for userId : ${data.projectMetaData.userId} projectId : ${data.projectMetaData.projectId} from ${data.serviceName} with message ${data.message}`);
        await ProjectService.updateProjectStatus(data.projectMetaData.projectId, data.projectMetaData.projectStatus);
        return NextResponse.json({ message: 'Project status updated', received: data }, { status: 200 });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
