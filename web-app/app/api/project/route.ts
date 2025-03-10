import { NextResponse } from 'next/server';
import { ProjectService } from '@/data-core/services/project-service';

interface RequestBody {
    processStatus: string,
    projectId: string,
}

export async function GET() {
    return NextResponse.json({ message: 'Hello from Next.js API' });
}

export async function POST(req: Request) {
    try {
        const data: RequestBody = await req.json();

        if (data.processStatus != 'COMPLETED') {
            throw new Error(`processing failed for project ${data.projectId}`);
        }

        await ProjectService.updateProjectStatus(data.projectId, "COMPLETED");
        return NextResponse.json({ message: 'Project status updated', received: data }, { status: 200 });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
