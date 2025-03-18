from dotenv import load_dotenv
import asyncio
from pydantic import BaseModel
from typing import List, Optional
import os

from pathlib import Path
from services.kafka_service import KafkaService
import json


load_dotenv()


KAFKA_BROKER = os.getenv("KAFKA_BROKER")
KAFKA_TOPIC_PROCESS_VIDEO = os.getenv("KAFKA_TOPIC_PROCESS_VIDEO")
GROUP_ID = "embedding-service-group"


async def consume():
    data = {
        "serviceName": "Embedding Service",
        "message": "video service started",
    }
    print("Message to backgournd job", data)
    await KafkaService.send_message_to_kafka(json.dumps(data))


if __name__ == "__main__":
    try:
        asyncio.run(consume())
    except KeyboardInterrupt:
        print("Shutting down...")
