
from uuid import uuid4
import boto3
from botocore.exceptions import ClientError
import magic
import uvicorn
from fastapi import FastAPI, HTTPException, Response, UploadFile, status
from loguru import logger

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

s3_client = session.client("s3")

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

    file_type = magic.from_buffer(buffer=contents, mime=True)
    if file_type not in {"video/mp4": "mp4"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type: {file_type}. Only MP4 allowed."
        )

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

if __name__ == "__main__":
    uvicorn.run(app="main:app", reload=True)
