from services.embedding_service import EmbeddingService
from services.s3_service import S3Service
from services.file_service import FileService
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
    local_file_path = S3Service.download_file_from_s3(userId, projectId)
    print("creating and traforminig")
    texts = EmbeddingService.load_json_file_and_transform(local_file_path)
    print(texts)
    vector_store = EmbeddingService.createVectorStore(texts)
    EmbeddingService.saveVectorStore(vector_store, f"vectorstore/{userId}/{projectId}/")
    s3_prefix = f"{userId}/{projectId}/original_content/vectorestore"
    S3Service.save_vectorstore_to_s3(f"vectorstore/{userId}/{projectId}/", s3_prefix)
    FileService.delete_transcript_directory(userId, projectId)
    return {"message": texts}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=6000)
