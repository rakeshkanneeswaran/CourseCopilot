import { NextResponse } from 'next/server';
import { ProjectService } from '@/data-core/services/project-service';

interface RequestBody {
    projectId: string;
    status: string;
}

export async function GET() {
    return NextResponse.json({ message: 'Hello from Next.js API' });
}

export async function POST(req: Request) {
    try {
        const data: RequestBody = await req.json();

        if (!data.projectId || !data.status) {
            return NextResponse.json({ error: 'Missing projectId or status' }, { status: 400 });
        }

        await ProjectService.updateProjectStatus(data.projectId, data.status);
        return NextResponse.json({ message: 'Project status updated', received: data });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
