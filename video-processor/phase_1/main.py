from uuid import uuid4
import boto3
from botocore.exceptions import ClientError

import requests

# import magic
import uvicorn
from fastapi import (
    FastAPI,
    HTTPException,
    Response,
    UploadFile,
    status,
    Body,
    BackgroundTasks,
)
from pydantic import BaseModel
from typing import List, Optional
from loguru import logger
import os
import subprocess
import shutil
from pathlib import Path
from botocore.exceptions import NoCredentialsError, PartialCredentialsError, ClientError

# from dotenv import load_dotenv
# Import your existing utility functions
from utils.transcribe import generate_transcript
from utils.translate import translate_transcript
from utils.combine_audio_video import combine_video_audio
from utils.generate_srt import generate_srt  # Assuming this function exists
import json

# load_dotenv()
# AWS Credentials
session = boto3.Session(
    aws_access_key_id="AKIAZOZQFQWQYVUHJSVG",
    aws_secret_access_key="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",
    region_name="ap-south-1",
)

# Constants
KB = 1024
MB = 1024 * KB
AWS_BUCKET = "eduverseai-production"
S3_DIRECTORY = "original_content/videos/"
OUTPUT_DIRECTORY = "outputs/"
TEMP_DIRECTORY = "temp/"

s3_client = session.client("s3")

# Create temp directories if they don't exist
os.makedirs(TEMP_DIRECTORY, exist_ok=True)
os.makedirs(OUTPUT_DIRECTORY, exist_ok=True)


def upload_to_s3(bucket_name: str, local_path: str, s3_key: str) -> bool:
    """
    Upload a file from a local path to an S3 bucket.

    Args:
        bucket_name (str): Name of the S3 bucket.
        local_path (str): Local path of the file to upload.
        s3_key (str): S3 key (path) where the file will be stored.

    Returns:
        bool: True if the upload was successful, False otherwise.
    """
    # s3_client = boto3.client("s3")
    try:
        logger.info(f"Uploading {local_path} to S3 bucket {bucket_name} at {s3_key}")
        s3_client.upload_file(local_path, bucket_name, s3_key)
        logger.info("Upload successful")
        return True
    except FileNotFoundError:
        logger.error(f"The local file {local_path} does not exist.")
        return False
    except NoCredentialsError:
        logger.error("No AWS credentials found.")
        return False
    except PartialCredentialsError:
        logger.error("Incomplete AWS credentials provided.")
        return False
    except ClientError as e:
        logger.error(f"S3 Client Error: {str(e)}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return False


def download_from_s3(bucket_name: str, s3_key: str, local_path: str) -> bool:
    """
    Download a file from an S3 bucket to a local path.

    Args:
        bucket_name (str): Name of the S3 bucket.
        s3_key (str): S3 key (path) of the file to download.
        local_path (str): Local path where the file will be saved.

    Returns:
        bool: True if the download was successful, False otherwise.
    """
    # s3_client = boto3.client("s3")
    try:
        logger.info(
            f"Downloading {s3_key} from S3 bucket {bucket_name} to {local_path}"
        )
        s3_client.download_file(bucket_name, s3_key, local_path)
        logger.info("Download successful")
        return True
    except FileNotFoundError:
        logger.error(f"The local path {local_path} does not exist.")
        return False
    except NoCredentialsError:
        logger.error("No AWS credentials found.")
        return False
    except PartialCredentialsError:
        logger.error("Incomplete AWS credentials provided.")
        return False
    except ClientError as e:
        logger.error(f"S3 Client Error: {str(e)}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return False


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


app = FastAPI()


@app.get("/health")
async def home():
    return {"message": "Hello from file-upload 😄👋", "status": 200}


@app.post("/process-video")
async def process_video(
    request: ProcessVideoRequest, background_tasks: BackgroundTasks
):
    """
    Process all videos in the userId/projectId/original_content/video directory.
    Perform transcription, translation, subtitle generation, and combine audio/video.
    """
    logger.info(f"Processing videos for project {request.projectId}")
    projectId = request.projectId
    userId = request.userId
    projectMetaData = request.projectMetaData

    # Create project-specific temp directory
    project_temp_dir = os.path.join(TEMP_DIRECTORY, projectId)
    os.makedirs(project_temp_dir, exist_ok=True)

    # S3 prefix for the original videos
    s3_video_prefix = f"{userId}/{projectId}/original_content/videos/"

    try:
        # 1. List all videos in the S3 directory
        response = s3_client.list_objects_v2(Bucket=AWS_BUCKET, Prefix=s3_video_prefix)
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
        background_tasks.add_task(
            process_video_async, request, project_temp_dir, response["Contents"]
        )
        return {
            "received": True,
            "projectId": projectId,
            "userId": userId,
            "projectMetaData": projectMetaData,
            "status": 200,
        }

    except Exception as e:
        logger.error(f"Error processing video: {str(e)}")
        # Clean up temporary files on error
        if os.path.exists(project_temp_dir):
            shutil.rmtree(project_temp_dir)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing video: {str(e)}",
        )


async def process_video_async(request, project_temp_dir, video_contents):
    try:
        result = {
            "userId": request.userId,
            "projectId": request.projectId,
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
                "userId": request.userId,
                "projectId": request.projectId,
                "original_video": video_key["Key"],
                "processed_videos": {},
            }

            # 4. Generate transcript if needed
            transcript_path = None
            if request.projectMetaData.generate_transcript:
                logger.info(f"Generating transcript for {video_name}")
                transcript_path = os.path.join(
                    project_temp_dir, f"transcript_{video_name}.json"
                )
                generate_transcript(video_path, transcript_path)

                # Upload transcript to S3
                transcript_s3_key = f"{request.userId}/{request.projectId}/original_content/transcripts/{video_name}.json"
                upload_to_s3(AWS_BUCKET, transcript_path, transcript_s3_key)
                result["transcript"] = transcript_s3_key

            # 5. Process for each language
            for language in request.projectMetaData.languages:
                lang_dir = os.path.join(project_temp_dir, language)
                os.makedirs(lang_dir, exist_ok=True)

                # Skip translation for source language (assuming English is source)
                translated_transcript_path = transcript_path
                if language != "English" and request.projectMetaData.generate_translate:
                    logger.info(f"Translating to {language}")
                    translated_transcript_path = os.path.join(
                        lang_dir, f"transcript_{language}_{video_name}.json"
                    )
                    translate_transcript(
                        transcript_path, translated_transcript_path, language
                    )

                    # Upload translated transcript to S3
                    translated_transcript_s3_key = f"{request.userId}/{request.projectId}/processed/{language}/transcripts/{video_name}.json"
                    upload_to_s3(
                        AWS_BUCKET,
                        translated_transcript_path,
                        translated_transcript_s3_key,
                    )
                # 6. Generate SRT file if needed
                subtitle_path = None
                if (
                    request.projectMetaData.generate_subtitle
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
                        f"{request.projectId}_{language}_{video_name}.mp4",
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
                        video_path, transcription, output_video_path, subtitle_path, language_name=language
                    )

                    # 8. Upload final video to S3
                    output_s3_key = f"{request.userId}/{request.projectId}/processed/{language}/videos/{video_name}"
                    upload_to_s3(AWS_BUCKET, output_video_path, output_s3_key)

                    # Add to result
                    result["processed_videos"][language] = output_s3_key

        # 9. Clean up temporary files
        shutil.rmtree(project_temp_dir)
        
        data = {"projectId": request.projectId, "status": "COMPLETED"}

        api_url = "http://localhost:3000/api/project/"

        response = requests.post(api_url, json=data)
        print(response.json())
        logger.info("Processing completed successfully")
        return {"projectId": request.projectId, "status": "200"}

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
    uvicorn.run(app="main:app", reload=True)

# @app.post("/process-video")
# async def process_video(request: ProcessVideoRequest, background_tasks: BackgroundTasks):
#     """
#     Process all videos in the userId/projectId/original_content/video directory.
#     Perform transcription, translation, subtitle generation, and combine audio/video.
#     """
#     logger.info(f"Processing videos for project {request.projectId}")
#     projectId = request.projectId
#     userId = request.userId

#     # Create project-specific temp directory
#     project_temp_dir = os.path.join(TEMP_DIRECTORY, projectId)
#     os.makedirs(project_temp_dir, exist_ok=True)

#     # S3 prefix for the original videos
#     s3_video_prefix = f"{userId}/{projectId}/original_content/videos/"

#     try:
#         # 1. List all videos in the S3 directory
#         response = s3_client.list_objects_v2(Bucket=AWS_BUCKET, Prefix=s3_video_prefix)
#         if "Contents" not in response:
#             raise HTTPException(
#                 status_code=status.HTTP_404_NOT_FOUND,
#                 detail="No videos found in the specified S3 directory"
#             )

#         # 2. Download all videos
#         for obj in response["Contents"]:
#             video_key = obj["Key"]
#             video_name = os.path.basename(video_key)
#             video_path = os.path.join(project_temp_dir, video_name)
#             logger.info(f"Downloading video: {video_key}")
#             download_from_s3(AWS_BUCKET, video_key, video_path)
#         logger.info("Download successful")
#         background_tasks.add_task(process_video_async, request, project_temp_dir, response["Contents"])
#         return {"message": "Download successful"}

#     except Exception as e:
#         logger.error(f"Error processing video: {str(e)}")
#         # Clean up temporary files on error
#         if os.path.exists(project_temp_dir):
#             shutil.rmtree(project_temp_dir)
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail=f"Error processing video: {str(e)}"
#         )

# async def process_video_async(request, project_temp_dir, video_contents):
#     result = {"userId": request.userId, "projectId": request.projectId, "processed_videos": {}}
#     try:
#         # 3. Process each video
#         for video_key in video_contents:
#             video_name = os.path.basename(video_key["Key"])
#             video_path = os.path.join(project_temp_dir, video_name)

#             # 4. Generate transcript if needed
#             transcript_path = None
#             if request.projectMetaData.generate_transcript:
#                 logger.info(f"Generating transcript for {video_name}")
#                 transcript_path = os.path.join(project_temp_dir, f"transcript_{video_name}.json")
#                 generate_transcript(video_path, transcript_path)

#                 # Upload transcript to S3
#                 transcript_s3_key = f"{request.userId}/{request.projectId}/original_content/transcripts/{video_name}.json"
#                 upload_to_s3(AWS_BUCKET, transcript_path, transcript_s3_key)
#                 result["transcript"] = transcript_s3_key

#             # 5. Process for each language
#             for language in request.projectMetaData.languages:
#                 lang_dir = os.path.join(project_temp_dir, language)
#                 os.makedirs(lang_dir, exist_ok=True)

#                 # Skip translation for source language (assuming English is source)
#                 translated_transcript_path = transcript_path
#                 if language != "English" and request.projectMetaData.generate_translate:
#                     logger.info(f"Translating to {language}")
#                     translated_transcript_path = os.path.join(lang_dir, f"transcript_{language}_{video_name}.json")
#                     translate_transcript(transcript_path, translated_transcript_path, language)

#                     # Upload translated transcript to S3
#                     translated_transcript_s3_key = f"{request.userId}/{request.projectId}/processed/{language}/transcripts/{video_name}.json"
#                     upload_to_s3(AWS_BUCKET, translated_transcript_path, translated_transcript_s3_key)

#                 # 6. Generate SRT file if needed
#                 subtitle_path = None
#                 if request.projectMetaData.generate_subtitle and translated_transcript_path:
#                     logger.info(f"Generating SRT for {language}")
#                     subtitle_path = os.path.join(lang_dir, f"subtitle_{language}_{video_name}.srt")
#                     generate_srt(translated_transcript_path, subtitle_path)

#                 # 7. Generate TTS audio and combine with video
#                 if translated_transcript_path:
#                     logger.info(f"Generating TTS and combining video for {language}")
#                     output_video_path = os.path.join(OUTPUT_DIRECTORY, f"{request.projectId}_{language}_{video_name}.mp4")
#                     with open(translated_transcript_path, "r", encoding="utf-8") as file:
#                         transcript_data = json.load(file)
#                     transcription = [
#                         {
#                             "start_time": entry["start_time"],
#                             "end_time": entry["end_time"],
#                             "text": entry["text"]
#                         } for entry in transcript_data
#                     ]

#                     combine_video_audio(video_path, transcription, output_video_path, subtitle_path)

#                     # 8. Upload final video to S3
#                     output_s3_key = f"{request.userId}/{request.projectId}/processed/{language}/videos/{video_name}"
#                     upload_to_s3(AWS_BUCKET, output_video_path, output_s3_key)

#                     # Add to result
#                     result["processed_videos"][language] = output_s3_key

#         # 9. Clean up temporary files
#         shutil.rmtree(project_temp_dir)

#         logger.info("Processing completed successfully")
#         return {"message": "Download and processing successful", "results": result}

#     except Exception as e:
#         logger.error(f"Error processing video: {str(e)}")
#         # Clean up temporary files on error
#         if os.path.exists(project_temp_dir):
#             shutil.rmtree(project_temp_dir)
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail=f"Error processing video: {str(e)}"
#         )

# if __name__ == "__main__":
#     uvicorn.run(app="main:app", reload=True)
