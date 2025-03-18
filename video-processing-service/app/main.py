from uuid import uuid4
import boto3
from botocore.exceptions import ClientError
from dotenv import load_dotenv
import asyncio
from kafka import KafkaConsumer
import uvicorn
from fastapi import (
    HTTPException,
    status,
)
from pydantic import BaseModel
from typing import List, Optional
from loguru import logger
import os
import subprocess
import shutil
from pathlib import Path
from botocore.exceptions import NoCredentialsError, PartialCredentialsError, ClientError
from services.transcribe import generate_transcript
from services.translate import translate_transcript
from services.combine_audio_video import combine_video_audio
from services.generate_srt import generate_srt  # Assuming this function exists
from services.kafka_service import KafkaService
import json


load_dotenv()

from utils.index import upload_to_s3, download_from_s3


KAFKA_BROKER = os.getenv("KAFKA_BROKER")
# AWS Credentials
session = boto3.Session(
    aws_access_key_id=os.getenv("aws_access_key_id"),
    aws_secret_access_key=os.getenv("aws_secret_access_key"),
    region_name=os.getenv("region_name"),
)
s3_client = session.client("s3")

# Constants
KB = 1024
MB = 1024 * KB
AWS_BUCKET = os.getenv("AWS_BUCKET")
S3_DIRECTORY = os.getenv("S3_DIRECTORY")
OUTPUT_DIRECTORY = os.getenv("OUTPUT_DIRECTORY")
TEMP_DIRECTORY = os.getenv("TEMP_DIRECTORY")
PORT = os.getenv("PORT")


# Create temp directories if they don't exist
os.makedirs(TEMP_DIRECTORY, exist_ok=True)
os.makedirs(OUTPUT_DIRECTORY, exist_ok=True)


# Define Pydantic models for input validation
class ProjectMetaData(BaseModel):
    generate_translate: bool = False
    generate_subtitle: bool = False
    languages: List[str] = ["English"]
    generate_transcript: bool = True
    gender: str = "male"


class ProcessVideoRequest(BaseModel):
    userId: str
    projectId: str
    projectMetaData: ProjectMetaData
    serviceName: str
    message: str


async def consume():
    consumer = KafkaConsumer(
        "process-video",
        bootstrap_servers=KAFKA_BROKER,
        auto_offset_reset="latest",
        enable_auto_commit=True,
        group_id="video-processor-group",
        key_deserializer=lambda k: k.decode() if k else None,
        value_deserializer=lambda v: json.loads(v.decode()) if v else None,
    )
    print("Kafka Consumer started...")
    for message in consumer:
        try:
            data = message.value
            print("Data from Kafka", data)
            projectId = data["projectId"]
            userId = data["userId"]
            projectMetaData = data["projectMetaData"]
            logger.info(f"Processing videos for project {projectId}")
            project_temp_dir = os.path.join(TEMP_DIRECTORY, projectId)
            os.makedirs(project_temp_dir, exist_ok=True)
            s3_video_prefix = f"{userId}/{projectId}/original_content/videos/"
            response = s3_client.list_objects_v2(
                Bucket=AWS_BUCKET, Prefix=s3_video_prefix
            )
            if "Contents" not in response:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="No videos found in the specified S3 directory",
                )

            # 2. Download all videos
            for obj in response["Contents"]:
                video_key = obj["Key"]
                video_name = os.path.basename(video_key)
                video_path = os.path.join(project_temp_dir, video_name)
                logger.info(f"Downloading video: {video_key}")
                download_from_s3(AWS_BUCKET, video_key, video_path)
            logger.info("Download successful")

            request = {
                "userId": userId,
                "projectId": projectId,
                "projectMetaData": projectMetaData,
            }
            await process_video_async(request, project_temp_dir, response["Contents"])
        except Exception as e:
            print(f"Error processing Kafka message: {e}")


async def process_video_async(request, project_temp_dir, video_contents):
    try:
        print("value of request", request)
        result = {
            "userId": request["userId"],
            "projectId": request["projectId"],
            "processed_videos": {},
        }

        # 3. Process each video
        for video_key in video_contents:
            video_name = os.path.basename(video_key["Key"])
            video_path = os.path.join(project_temp_dir, video_name)
            print("-------------------------------------------------------------")
            print(" Video Path", video_path, "Video Name", video_name)
            print("-------------------------------------------------------------")
            result = {
                "userId": request["userId"],
                "projectId": request["projectId"],
                "original_video": video_key["Key"],
                "processed_videos": {},
            }

            # 4. Generate transcript if needed
            transcript_path = None
            if request["projectMetaData"]["generate_transcript"]:
                logger.info(f"Generating transcript for {video_name}")
                transcript_path = os.path.join(
                    project_temp_dir, f"transcript_{video_name}.json"
                )
                generate_transcript(video_path, transcript_path)

                # Upload transcript to S3
                transcript_s3_key = f"{request['userId']}/{request['projectId']}/original_content/transcripts/{video_name}.json"
                upload_to_s3(AWS_BUCKET, transcript_path, transcript_s3_key)
                result["transcript"] = transcript_s3_key

            # 5. Process for each language
            for language in request["projectMetaData"]["languages"]:
                lang_dir = os.path.join(project_temp_dir, language)
                os.makedirs(lang_dir, exist_ok=True)

                # Skip translation for source language (assuming English is source)
                translated_transcript_path = transcript_path
                if (
                    language != "English"
                    and request["projectMetaData"]["generate_translate"]
                ):
                    logger.info(f"Translating to {language}")
                    translated_transcript_path = os.path.join(
                        lang_dir, f"transcript_{language}_{video_name}.json"
                    )
                    translate_transcript(
                        transcript_path, translated_transcript_path, language
                    )

                    # Upload translated transcript to S3
                    translated_transcript_s3_key = f"{request['userId']}/{request['projectId']}/processed/{language}/transcripts/{video_name}.json"
                    upload_to_s3(
                        AWS_BUCKET,
                        translated_transcript_path,
                        translated_transcript_s3_key,
                    )
                # 6. Generate SRT file if needed
                subtitle_path = None
                if (
                    request["projectMetaData"]["generate_subtitle"]
                    and translated_transcript_path
                ):
                    logger.info(f"Generating SRT for {language}")
                    subtitle_path = os.path.join(
                        lang_dir, f"subtitle_{language}_{video_name}.srt"
                    )
                    generate_srt(translated_transcript_path, subtitle_path)

                    # Upload subtitle to S3
                    # subtitle_s3_key = f"{request.userId}/{request.projectId}/translate/{language}/subtitle/{video_name}.srt"
                    # upload_to_s3(AWS_BUCKET, subtitle_path, subtitle_s3_key)

                    # if "subtitles" not in result:
                    #     result["subtitles"] = {}
                    # result["subtitles"][language] = subtitle_s3_key

                # 7. Generate TTS audio and combine with video
                if translated_transcript_path:
                    logger.info(f"Generating TTS and combining video for {language}")
                    output_video_path = os.path.join(
                        OUTPUT_DIRECTORY,
                        f"{request['projectId']}_{language}_{video_name}.mp4",
                    )
                    with open(
                        translated_transcript_path, "r", encoding="utf-8"
                    ) as file:
                        transcript_data = json.load(file)
                    transcription = [
                        {
                            "start_time": entry["start_time"],
                            "end_time": entry["end_time"],
                            "text": entry["text"],
                        }
                        for entry in transcript_data
                    ]

                    # combine_video_audio(video_path, transcription, output_video_path,subtitle_path,language_code="ta-IN", language_name="ta-IN-Standard-D", ssml_gender="male")
                    combine_video_audio(
                        video_path,
                        transcription,
                        output_video_path,
                        subtitle_path,
                        language_name=language,
                    )

                    # 8. Upload final video to S3
                    output_s3_key = f"{request['userId']}/{request['projectId']}/processed/{language}/videos/{video_name}"
                    upload_to_s3(AWS_BUCKET, output_video_path, output_s3_key)

                    # Add to result
                    result["processed_videos"][language] = output_s3_key

        # 9. Clean up temporary files
        shutil.rmtree(project_temp_dir)
        # Delete output files in OUTPUT_DIRECTORY but keep the folder
        for filename in os.listdir(OUTPUT_DIRECTORY):
            file_path = os.path.join(OUTPUT_DIRECTORY, filename)
            try:
                if os.path.isfile(file_path) or os.path.islink(file_path):
                    os.unlink(file_path)
                elif os.path.isdir(file_path):
                    shutil.rmtree(file_path)
            except Exception as e:
                logger.error(f"Failed to delete {file_path}. Reason: {str(e)}")

        data = {
            "projectId": request["projectId"],
            "status": 200,
            "userId": request["userId"],
            "serviceName": "Video Processor",
            "message": "Video Processing Completed",
        }

        print("Message to backgournd job", data)
        await KafkaService.send_message_to_kafka(json.dumps(data))

    except Exception as e:
        logger.error(f"Error processing video: {str(e)}")
        # Clean up temporary files on error
        if os.path.exists(project_temp_dir):
            shutil.rmtree(project_temp_dir)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing video: {str(e)}",
        )


if __name__ == "__main__":
    try:
        asyncio.run(consume())
    except KeyboardInterrupt:
        print("Shutting down...")
