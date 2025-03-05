from uuid import uuid4
import boto3
from botocore.exceptions import ClientError
import magic
import uvicorn
from fastapi import FastAPI, HTTPException, Response, UploadFile, status, Body
from pydantic import BaseModel
from typing import List, Optional
from loguru import logger
import os
import subprocess
import shutil
from pathlib import Path

# Import your existing utility functions
from references.download import download_from_s3
from references.upload import upload_to_s3
from utils.transcribe import generate_transcript
from utils.translate import translate_transcript
from utils.tts import generate_tts_audio
from utils.combine_video_audio import combine_video_audio

# AWS Credentials
session = boto3.Session(
    aws_access_key_id='AKIAZOZQFQWQYVUHJSVG',
    aws_secret_access_key='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',
    region_name='ap-south-1'
)

# Constants
KB = 1024
MB = 1024 * KB
AWS_BUCKET = "course-co-pilot-dev"
S3_DIRECTORY = "original_content/videos/"
OUTPUT_DIRECTORY = "outputs/"
TEMP_DIRECTORY = "temp/"

s3_client = session.client("s3")

# Create temp directories if they don't exist
os.makedirs(TEMP_DIRECTORY, exist_ok=True)
os.makedirs(OUTPUT_DIRECTORY, exist_ok=True)

async def s3_upload(contents: bytes, key: str):
    """Uploads file to S3 in the specified directory"""
    full_key = f"{S3_DIRECTORY}{key}"  # Store in the specific path
    logger.info(f"Uploading {full_key} to S3")
    try:
        s3_client.put_object(Bucket=AWS_BUCKET, Key=full_key, Body=contents)
        return full_key  # Return full S3 path
    except ClientError as e:
        logger.error(f"S3 Upload Error: {str(e)}")
        return None

async def s3_download(key: str):
    """Downloads file from S3"""
    try:
        full_key = f"{S3_DIRECTORY}{key}"
        obj = s3_client.get_object(Bucket=AWS_BUCKET, Key=full_key)
        return obj["Body"].read()
    except ClientError as e:
        logger.error(f"S3 Download Error: {str(e)}")
        return None

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

@app.get("/")
async def home():
    return {"message": "Hello from file-upload 😄👋"}

@app.post("/process-video")
async def process_video(request: ProcessVideoRequest):
    """
    Process all videos in the userId/projectId/original_content/video directory.
    Perform transcription, translation, subtitle generation, and combine audio/video.
    """
    logger.info(f"Processing videos for project {request.projectId}")

    # Create project-specific temp directory
    project_temp_dir = os.path.join(TEMP_DIRECTORY, request.projectId)
    os.makedirs(project_temp_dir, exist_ok=True)

    # S3 prefix for the original videos
    s3_video_prefix = f"{request.userId}/{request.projectId}/original_content/video/"

    try:
        # 1. List all videos in the S3 directory
        response = s3_client.list_objects_v2(Bucket=AWS_BUCKET, Prefix=s3_video_prefix)
        if "Contents" not in response:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No videos found in the specified S3 directory"
            )

        # 2. Download all videos
        for obj in response["Contents"]:
            video_key = obj["Key"]
            video_name = os.path.basename(video_key)
            video_path = os.path.join(project_temp_dir, video_name)
            logger.info(f"Downloading video: {video_key}")
            download_from_s3(AWS_BUCKET, video_key, video_path)

        logger.info("Download successful")

        # 3. Process each video
        for video_key in response["Contents"]:
            video_name = os.path.basename(video_key["Key"])
            video_path = os.path.join(project_temp_dir, video_name)

            result = {
                "userId": request.userId,
                "projectId": request.projectId,
                "original_video": video_key["Key"],
                "processed_videos": {}
            }

            # 4. Generate transcript if needed
            transcript_path = None
            if request.projectMetaData.generate_transcript:
                logger.info(f"Generating transcript for {video_name}")
                transcript_path = os.path.join(project_temp_dir, f"transcript_{video_name}.json")
                generate_transcript(video_path, transcript_path)

                # Upload transcript to S3
                transcript_s3_key = f"{request.userId}/{request.projectId}/transcripts/{video_name}.json"
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
                    translated_transcript_path = os.path.join(lang_dir, f"transcript_{language}_{video_name}.json")
                    translate_transcript(transcript_path, translated_transcript_path, language)

                # 6. Generate TTS audio
                if translated_transcript_path:
                    logger.info(f"Generating TTS for {language}")
                    audio_path = os.path.join(lang_dir, f"audio_{language}_{video_name}.mp3")
                    generate_tts_audio(translated_transcript_path, audio_path, gender=request.projectMetaData.gender)

                    # 7. Combine video with audio
                    output_video_path = os.path.join(OUTPUT_DIRECTORY, f"{request.projectId}_{language}_{video_name}.mp4")
                    logger.info(f"Combining video and audio for {language}")
                    combine_video_audio(video_path, audio_path, output_video_path)

                    # 8. Upload final video to S3
                    output_s3_key = f"{request.userId}/{request.projectId}/translate/{language}/video/{video_name}"
                    upload_to_s3(AWS_BUCKET, output_video_path, output_s3_key)

                    # Add to result
                    result["processed_videos"][language] = output_s3_key

                    # 9. Upload subtitle file if needed
                    if request.projectMetaData.generate_subtitle:
                        subtitle_path = os.path.join(lang_dir, f"subtitle_{language}_{video_name}.srt")
                        # Assuming the subtitle generation is handled in one of your functions
                        # generate_subtitle(translated_transcript_path, subtitle_path)

                        subtitle_s3_key = f"{request.userId}/{request.projectId}/translate/{language}/subtitle/{video_name}.srt"
                        upload_to_s3(AWS_BUCKET, subtitle_path, subtitle_s3_key)

                        if "subtitles" not in result:
                            result["subtitles"] = {}
                        result["subtitles"][language] = subtitle_s3_key

        # 10. Clean up temporary files
        shutil.rmtree(project_temp_dir)

        return {"message": "Download and processing successful", "results": result}

    except Exception as e:
        logger.error(f"Error processing video: {str(e)}")
        # Clean up temporary files on error
        if os.path.exists(project_temp_dir):
            shutil.rmtree(project_temp_dir)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing video: {str(e)}"
        )

if __name__ == "__main__":
    uvicorn.run(app="main:app", reload=True)