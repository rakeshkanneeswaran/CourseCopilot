from uuid import uuid4
import boto3
from botocore.exceptions import ClientError
# import magic
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
from utils.combine_audio_video import combine_video_audio

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
S3_DIRECTORY = "01ac2a4f-0107-4207-accf-1c1d523a5bb7/e6023e1e-5a45-48ec-8cd8-ed7d365e1970/original_content/videos/"
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
    videoKey: Optional[str] = None  # S3 key for the video to process

app = FastAPI()

@app.get("/")
async def home():
    return {"message": "Hello from file-upload 😄👋"}

@app.post("/upload")
async def upload(file: UploadFile | None = None):
    if not file:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file found!!"
        )

    contents = await file.read()
    size = len(contents)

    if not 0 < size <= 100 * MB:  # Allow up to 100MB uploads
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Supported file size is 0 - 100 MB"
        )

    # file_type = magic.from_buffer(buffer=contents, mime=True)
    # if file_type not in {"video/mp4": "mp4"}:
    #     raise HTTPException(
    #         status_code=status.HTTP_400_BAD_REQUEST,
    #         detail=f"Unsupported file type: {file_type}. Only MP4 allowed."
    #     )

    file_name = f"{uuid4()}.mp4"  # Generate unique file name
    full_s3_path = await s3_upload(contents=contents, key=file_name)

    if not full_s3_path:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload file to S3"
        )

    return {"file_name": file_name, "s3_path": full_s3_path}

@app.get("/download")
async def download(file_name: str | None = None):
    if not file_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file name provided"
        )

    contents = await s3_download(key=file_name)
    if contents is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found in S3"
        )

    return Response(
        content=contents,
        headers={
            "Content-Disposition": f"attachment;filename={file_name}",
            "Content-Type": "video/mp4",
        }
    )

@app.post("/process-video")
async def process_video(request: ProcessVideoRequest):
    """
    Process a video from S3: generate transcript, translate, create TTS, and combine with video.
    Returns S3 URLs for each processed video.
    """
    logger.info(f"Processing video for project {request.projectId}")
    
    if not request.videoKey:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No video key provided"
        )
    
    # Create project-specific temp directory
    project_temp_dir = os.path.join(TEMP_DIRECTORY, request.projectId)
    os.makedirs(project_temp_dir, exist_ok=True)
    
    try:
        # 1. Download video from S3
        video_path = os.path.join(project_temp_dir, f"original.mp4")
        logger.info(f"Downloading video from S3: {request.videoKey}")
        download_from_s3(AWS_BUCKET, f"{S3_DIRECTORY}{request.videoKey}", video_path)
        
        result = {
            "userId": request.userId,
            "projectId": request.projectId,
            "original_video": request.videoKey,
            "processed_videos": {}
        }
        
        # 2. Generate transcript if needed
        transcript_path = None
        if request.projectMetaData.generate_transcript:
            logger.info("Generating transcript")
            transcript_path = os.path.join(project_temp_dir, "transcript.json")
            generate_transcript(video_path, transcript_path)
            
            # Upload transcript to S3
            transcript_s3_key = f"{request.userId}/{request.projectId}/transcripts/original.json"
            upload_to_s3(AWS_BUCKET, transcript_path, transcript_s3_key)
            result["transcript"] = transcript_s3_key
        
        # 3. Process for each language
        for language in request.projectMetaData.languages:
            lang_dir = os.path.join(project_temp_dir, language)
            os.makedirs(lang_dir, exist_ok=True)
            
            # Skip translation for source language (assuming English is source)
            translated_transcript_path = transcript_path
            if language != "English" and request.projectMetaData.generate_translate:
                logger.info(f"Translating to {language}")
                translated_transcript_path = os.path.join(lang_dir, f"transcript_{language}.json")
                translate_transcript(transcript_path, translated_transcript_path, language)
            
            # 4. Generate TTS audio
            if translated_transcript_path:
                logger.info(f"Generating TTS for {language}")
                audio_path = os.path.join(lang_dir, f"audio_{language}.mp3")
                generate_tts_audio(translated_transcript_path, audio_path, gender=request.projectMetaData.gender)
                
                # 5. Combine video with audio
                output_video_path = os.path.join(OUTPUT_DIRECTORY, f"{request.projectId}_{language}.mp4")
                logger.info(f"Combining video and audio for {language}")
                combine_video_audio(video_path, audio_path, output_video_path)
                
                # 6. Upload final video to S3
                # userid/projectid/translations/language_name/{videos,trascripts}
                output_s3_key = f"{request.userId}/{request.projectId}/videos/{language}.mp4"
                upload_to_s3(AWS_BUCKET, output_video_path, output_s3_key)
                
                # Add to result
                result["processed_videos"][language] = output_s3_key
                
                # Upload subtitle file if needed
                if request.projectMetaData.generate_subtitle:
                    # Assuming the subtitle generation is handled in one of your functions
                    # or you can add that functionality
                    subtitle_path = os.path.join(lang_dir, f"subtitle_{language}.srt")
                    # generate_subtitle(translated_transcript_path, subtitle_path)
                    
                    subtitle_s3_key = f"{request.userId}/{request.projectId}/subtitles/{language}.srt"
                    upload_to_s3(AWS_BUCKET, subtitle_path, subtitle_s3_key)
                    
                    if "subtitles" not in result:
                        result["subtitles"] = {}
                    result["subtitles"][language] = subtitle_s3_key
        
        # 7. Clean up temporary files
        shutil.rmtree(project_temp_dir)
        
        return result
    
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