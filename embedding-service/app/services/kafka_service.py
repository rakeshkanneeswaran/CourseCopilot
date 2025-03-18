from kafka import KafkaProducer
import json
from dotenv import load_dotenv
import os

load_dotenv()

# Kafka configuration
KAFKA_BROKER = os.getenv("KAFKA_BROKER")
KAFKA_TOPIC = os.getenv("KAFKA_TOPIC_UPDATE")

# Create a Kafka producer
producer = KafkaProducer(
    bootstrap_servers=KAFKA_BROKER,
    value_serializer=lambda v: json.dumps(v).encode("utf-8"),
)


class KafkaService:
    @staticmethod
    async def send_message_to_kafka(data):
        producer.send(KAFKA_TOPIC, value=json.loads(data))
        producer.flush()
        print("Message sent to Kafka from video processor")
