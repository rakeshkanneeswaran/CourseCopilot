from services.s3_service import download_file_from_s3
from services.embedding_service import EmbeddingService
from dotenv import load_dotenv
from fastapi import FastAPI, Request
import uvicorn


load_dotenv()


app = FastAPI()


@app.post("/items/")
async def main(request: Request):
    print("Request received")
    data = await request.json()
    userId = data["userId"]
    projectId = data["projectId"]

    download_file_from_s3(userId, projectId)


@app.post("/create/vectorstore/")
async def createVectorStore(request: Request):
    print("Request received")
    data = await request.json()
    userId = data["userId"]
    projectId = data["projectId"]
    texts = data["texts"]
    vector = EmbeddingService.createVectorStore([texts])
    EmbeddingService.saveVectorStore(vector, f"vectorstore/{userId}/{projectId}/")


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=6000)
