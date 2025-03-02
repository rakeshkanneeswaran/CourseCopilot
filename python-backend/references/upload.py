import requests
import os

# File to upload
video_path = "Claude37.mp4"

# FastAPI upload endpoint
url = "http://127.0.0.1:8000/upload"

# Open the file and send it
with open(video_path, "rb") as f:
    files = {"file": ("sample_video.mp4", f, "video/mp4")}
    response = requests.post(url, files=files)

# Check response
if response.status_code == 200:
    print(f"✅ File uploaded successfully! S3 File Name: {response.json().get('file_name')}")
else:
    print(f"❌ Upload failed! Error: {response.status_code}, {response.json()}")
