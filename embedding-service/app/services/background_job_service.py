from services.embedding_service import EmbeddingService
from services.s3_service import S3Service
from services.file_service import FileService
from services.kafka_service import KafkaService
import requests
import os
import shutil
import json


class BackgroundJobService:
    @staticmethod
    async def run_background_job(userId, projectId):
        try:
            print(f"Running background job for {userId} and {projectId}")
            local_file_path = S3Service.download_file_from_s3(userId, projectId)
            texts = EmbeddingService.load_json_file_and_transform(local_file_path)
            vector_store = EmbeddingService.createVectorStore(texts)
            EmbeddingService.saveVectorStore(
                vector_store, f"vectorstore/{userId}/{projectId}/"
            )
            s3_prefix = f"{userId}/{projectId}/original_content/vectorestore"
            print(f"Uploading to s3 with prefix {s3_prefix}")
            S3Service.save_vectorstore_to_s3(
                f"vectorstore/{userId}/{projectId}/", s3_prefix
            )
            print(f"Deleting local file {local_file_path}")
            shutil.rmtree(f"transcripts/{userId}")
            print(f"Updating status for {userId} and {projectId}")
            playload = {
                "processStatus": "COMPLETED",
                "userId": userId,
                "projectId": projectId,
                "serviceName": "Embedding Service",
                "message": "embedding process done",
            }
            print(f"Sending message to Kafka {playload}")
            json_string = json.dumps(playload)
            await KafkaService.send_message_to_kafka(json_string)

        except Exception as e:
            raise e
