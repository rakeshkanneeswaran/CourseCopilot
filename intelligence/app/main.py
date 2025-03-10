from services.s3_service import S3Service
from services.vector_store_service import VectorStoreService
from services.llm_service import LLMService
from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import uvicorn
import json


load_dotenv()


app = FastAPI()

active_vectore_stores = {}


@app.websocket("/ws/{userId}/{projectId}")
async def websocket_endpoint(websocket: WebSocket, userId: str, projectId: str):
    await websocket.accept()
    print(f"User{userId} connected for project {projectId}")

    S3Service.get_vector_store_from_s3(userId, projectId)
    vectorStore = VectorStoreService.loadVectorStore(
        f"vectorstore/{userId}/{projectId}/"
    )
    active_vectore_stores[(userId, userId)] = vectorStore

    try:
        while True:
            data = await websocket.receive_text()
            answer = VectorStoreService.retrieveText(vectorStore, data)
            test_content = VectorStoreService.getContentForTestGeneration(vectorStore)
            mcq_answer = LLMService.generateMCQs(test_content)
            print("this is mcq answer")
            print(mcq_answer)
            llm_answer = LLMService.generateResponse(answer, data)
            await websocket.send_text(json.dumps(llm_answer))

    except WebSocketDisconnect:
        print(f"User {userId} disconnected. Cleaning up...")
        del active_vectore_stores[(userId, projectId)]  # Remove from memory


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=3004, reload=True)
