
import requests
import os

# S3 file path inside your bucket
file_name = "01ac2a4f-0107-4207-accf-1c1d523a5bb7/e6023e1e-5a45-48ec-8cd8-ed7d365e1970/original_content/videos/e6023e1e-5a45-48ec-8cd8-ed7d365e1970_1.mp4"

# FastAPI endpoint
url = f"http://127.0.0.1:8000/download?file_name={file_name}"

# Windows download location (Downloads folder)
download_path = "downloaded_video.mp4"

# Make request
response = requests.get(url)

if response.status_code == 200:
    with open(download_path, "wb") as f:
        f.write(response.content)
    print(f"✅ File downloaded successfully at {download_path}")
else:
    print(f"❌ Error: {response.status_code}, {response.json()}")
