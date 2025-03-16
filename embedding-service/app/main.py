from services.embedding_service import EmbeddingService
from services.s3_service import S3Service
from services.file_service import FileService
from services.background_job_service import BackgroundJobService
from dotenv import load_dotenv
from fastapi import FastAPI, Request, BackgroundTasks
import uvicorn
import requests
import os


load_dotenv()


app = FastAPI()


@app.post("/create/vectorstore/")
async def main(request: Request, background_tasks: BackgroundTasks):
    try:
        data = await request.json()
        userId = data["projectMetaData"]["userId"]
        projectId = data["projectMetaData"]["projectId"]
        print(
            f"Received request from  {data['serviceName']} for userId: {userId} and projectId: {projectId} with message {data['message']} at {data['timestamp']}"
        )
        if not (userId and projectId):
            return {"status": 400, "message": "userId and projectId are required"}
        background_tasks.add_task(
            BackgroundJobService.run_background_job, userId, projectId
        )
        return {"status": 200, "message": "Job started"}
    except Exception as e:
        request_to_update_status = requests.post(
            os.getenv("UPDATE_EMBEDDING_SERVICE_URL"),
            json={
                "processStatus": "FAILED",
                "userId": userId,
                "projectId": projectId,
                "serviceName": "Embedding Service",
                "message": "embedding failed",
                "error": str(e),
            },
        )
        if request_to_update_status.status_code != 200:
            raise Exception("Failed to update status")
        return {"error": str(e)}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=3003, reload=True)
