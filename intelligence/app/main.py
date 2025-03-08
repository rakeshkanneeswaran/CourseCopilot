from services.s3_service import S3Service
from services.vector_store_service import VectorStoreService
from dotenv import load_dotenv
from fastapi import FastAPI, Request
import uvicorn


load_dotenv()


app = FastAPI()


@app.post("/create/vectorstore/")
async def main(request: Request):
    print("Request received")
    data = await request.json()
    userId = data["userId"]
    projectId = data["projectId"]
    print(projectId, userId)
    S3Service.get_vector_store_from_s3(userId, projectId)
    vectorStore = VectorStoreService.loadVectorStore(
        f"vectorstore/{userId}/{projectId}/"
    )
    answer = VectorStoreService.retrieveText(vectorStore, "what is a router")
    return {"message": answer}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=6000, reload=True)
