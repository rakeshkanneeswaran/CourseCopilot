from services.embedding_service import EmbeddingService
from services.s3_service import S3Service
from services.file_service import FileService
import requests
import os
import shutil


class BackgroundJobService:
    @staticmethod
    async def run_background_job(userId, projectId):
        try:
            print(f"Running background job for {userId} and {projectId}")
            local_file_path = S3Service.download_file_from_s3(userId, projectId)
            print("tranforming json file into normal text")
            texts = EmbeddingService.load_json_file_and_transform(local_file_path)
            print("creating vecorstore")
            vector_store = EmbeddingService.createVectorStore(texts)
            print("this is the vectorstore", vector_store)
            print(f"vectorstore/{userId}/{projectId}/")
            EmbeddingService.saveVectorStore(
                vector_store, f"vectorstore/{userId}/{projectId}/"
            )
            s3_prefix = f"{userId}/{projectId}/original_content/vectorestore"
            print(f"Uploading to s3 with prefix {s3_prefix}")
            S3Service.save_vectorstore_to_s3(
                f"vectorstore/{userId}/{projectId}/", s3_prefix
            )
            print(f"Deleting local file {local_file_path}")
            # FileService.delete_transcript_directory(userId, projectId)
            shutil.rmtree(f"transcripts/{userId}")
            print(f"Updating status for {userId} and {projectId}")
            request_to_update_status = requests.post(
                os.getenv("UPDATE_EMBEDDING_SERVICE_URL"),
                json={
                    "processStatus": "COMPLETED",
                    "userId": userId,
                    "projectId": projectId,
                    "serviceName": "Embedding Service",
                    "message": "embedding process done",
                },
            )
            if request_to_update_status.status_code != 200:
                raise Exception("Failed to update status")
        except Exception as e:
            request_to_update_status = requests.post(
                os.getenv("UPDATE_EMBEDDING_SERVICE_URL"),
                json={"status": "FAILED", "projectId": projectId},
            )
            raise e
