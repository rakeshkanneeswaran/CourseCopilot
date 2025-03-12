# from services.s3_service import S3Service
# from services.vector_store_service import VectorStoreService
# from services.llm_service import LLMService
# from services.mcq_service import MCQService
# from dotenv import load_dotenv
# from fastapi import FastAPI, WebSocket, WebSocketDisconnect
# import uvicorn
# import json


# load_dotenv()


# app = FastAPI()

# active_vectore_stores = {}


# @app.websocket("/ws/{userId}/{projectId}")
# async def websocket_endpoint(websocket: WebSocket, userId: str, projectId: str):
#     await websocket.accept()
#     print(f"User{userId} connected for project {projectId}")

#     S3Service.get_vector_store_from_s3(userId, projectId)
#     vectorStore = VectorStoreService.loadVectorStore(
#         f"vectorstore/{userId}/{projectId}/"
#     )
#     active_vectore_stores[(userId, userId)] = vectorStore

#     try:
#         while True:
#             data = await websocket.receive_text()
#             data = json.loads(data)
#             request_type = data["request_type"]

#             if request_type == "mcq":
#                 test_content = VectorStoreService.getContentForTestGeneration(
#                     vectorStore
#                 )
#                 mcq_answer = MCQService.generateMCQs(test_content)
#                 await websocket.send_text(json.dumps(mcq_answer))
#             elif request_type == "query":
#                 context = VectorStoreService.retrieveText(vectorStore, data["query"])
#                 llm_answer = LLMService.generateResponse(context, str(data["query"]))
#                 await websocket.send_text(json.dumps(llm_answer))

#     except WebSocketDisconnect:
#         print(f"User {userId} disconnected. Cleaning up...")
#         del active_vectore_stores[(userId, projectId)]  # Remove from memory


# if __name__ == "__main__":
#     uvicorn.run("main:app", host="0.0.0.0", port=3004, reload=True)


from services.s3_service import S3Service
from services.vector_store_service import VectorStoreService
from services.llm_service import LLMService
from services.mcq_service import MCQService
from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
import uvicorn
import json


load_dotenv()

app = FastAPI()

# Keep original variable name
active_vectore_stores = {}


@app.websocket("/ws/{userId}/{projectId}")
async def websocket_endpoint(websocket: WebSocket, userId: str, projectId: str):
    await websocket.accept()
    print(f"User {userId} connected for project {projectId}")

    # Load vector store
    S3Service.get_vector_store_from_s3(userId, projectId)
    vectorStore = VectorStoreService.loadVectorStore(
        f"vectorstore/{userId}/{projectId}/"
    )
    # Use original key format
    active_vectore_stores[(userId, userId)] = vectorStore

    try:
        while True:
            data = await websocket.receive_text()
            data = json.loads(data)
            request_type = data["request_type"]

            # Only handle query requests via WebSocket
            if request_type == "query":
                context = VectorStoreService.retrieveText(vectorStore, data["query"])
                llm_answer = LLMService.generateResponse(context, str(data["query"]))
                await websocket.send_text(json.dumps(llm_answer))

    except WebSocketDisconnect:
        print(f"User {userId} disconnected.")
        # Keep vector store in memory for HTTP requests


@app.post("/mcq")
async def generate_mcq(request_data: dict):
    userId = request_data.get("userId")
    projectId = request_data.get("projectId")

    if not userId or not projectId:
        return JSONResponse(
            status_code=400, content={"error": "userId and projectId are required"}
        )

    # Check if vector store is already loaded
    if (userId, userId) not in active_vectore_stores:
        # Load from S3 if not available
        S3Service.get_vector_store_from_s3(userId, projectId)
        vectorStore = VectorStoreService.loadVectorStore(
            f"vectorstore/{userId}/{projectId}/"
        )
        active_vectore_stores[(userId, userId)] = vectorStore
    else:
        vectorStore = active_vectore_stores[(userId, userId)]

    # Generate MCQs using the loaded vector store
    test_content = VectorStoreService.getContentForTestGeneration(vectorStore)
    mcq_answer = MCQService.generateMCQs(test_content)

    # Return the raw mcq_answer which should already be in the correct format
    # from your MCQService (Pydantic -> dict conversion happens automatically)
    return mcq_answer


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=3004, reload=True)
