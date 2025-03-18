from services.background_job_service import BackgroundJobService
from dotenv import load_dotenv
import requests
import os
import json
import asyncio
from kafka import KafkaConsumer

load_dotenv()

KAFKA_BROKER = os.getenv("KAFKA_BROKER")
KAFKA_TOPIC = os.getenv("KAFKA_TOPIC_CONSUMER")
GROUP_ID = "embedding-service-group"


async def consume():
    consumer = KafkaConsumer(
        KAFKA_TOPIC,
        bootstrap_servers=KAFKA_BROKER,
        auto_offset_reset="latest",
        enable_auto_commit=True,
        group_id=GROUP_ID,
        key_deserializer=lambda k: k.decode() if k else None,
        value_deserializer=lambda v: json.loads(v.decode()) if v else None,
    )

    print("Kafka Consumer started...")

    for message in consumer:
        try:
            data = message.value
            userId = data["projectMetaData"].get("userId")
            projectId = data["projectMetaData"].get("projectId")

            if not userId or not projectId:
                print("Missing userId or projectId")
                continue

            print(
                f"Received request from {data['serviceName']} for userId: {userId} and projectId: {projectId} with message {data['message']} at {data['timestamp']}"
            )
            # Run the background job asynchronously
            await BackgroundJobService.run_background_job(userId, projectId)

        except Exception as e:
            print(f"Error processing Kafka message: {e}")


async def main():
    # Start Kafka consumer
    await consume()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("Shutting down...")
