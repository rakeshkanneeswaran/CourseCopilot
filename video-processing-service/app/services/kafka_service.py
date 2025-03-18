from kafka import KafkaProducer
import json
from dotenv import load_dotenv
import os

load_dotenv()

# Kafka configuration
KAFKA_BROKER = os.getenv("KAFKA_BROKER")


# Create a Kafka producer
producer = KafkaProducer(
    bootstrap_servers=KAFKA_BROKER,
    value_serializer=lambda v: json.dumps(v).encode("utf-8"),
)


class KafkaService:
    @staticmethod
    async def send_message_to_kafka(data):
        print("Sending message to Kafka", data)
        result = producer.send("process-video-update", value=json.loads(data))
        producer.flush()
        print("this is the result of sending to kafka", result)
        print("Message sent to Kafka")
