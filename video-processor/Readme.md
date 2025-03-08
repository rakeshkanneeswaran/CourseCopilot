# EduVerseAI Video Processor

## Overview

This project is a Python backend for processing videos, including transcription, translation, subtitle generation, and combining audio with video. The backend uses various libraries and APIs such as Google Cloud Text-to-Speech, MoviePy, Pydub, and Whisper.

## Prerequisites

- Python 3.8 or higher
- Poetry (for dependency management)
- Google Cloud credentials for Text-to-Speech
- AWS credentials for S3

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository_url>
cd EduVerseAI/video-processor
```
### 2. Install Dependencies

Use Poetry to install the project dependencies:

```bash
poetry install
```

### 3. Activate the Virtual Environment

Activate the Poetry virtual environment:

```bash
poetry shell
```

Alternatively, you can manually activate the virtual environment by copying the path provided by Poetry:

```bash
poetry env activate
```

Copy the path and use it to activate the virtual environment:

```bash
source <path_to_virtual_environment>/bin/activate
```

### 4. Set Up Environment Variables

Create a `.env` file in the `video-processor` directory and add the following environment variables:

```
GOOGLE_APPLICATION_CREDENTIALS=<path_to_google_credentials_json>
AWS_ACCESS_KEY_ID=<your_aws_access_key_id>
AWS_SECRET_ACCESS_KEY=<your_aws_secret_access_key>
```

### 5. Run the Application

Start the FastAPI application:

```bash
uvicorn main:app --reload
```

The application will be available at [http://localhost:8000](http://localhost:8000).

## API Endpoints

### Health Check

- **Endpoint:** `/health`
- **Method:** `GET`
- **Description:** Check the health status of the application.

### Process Video

- **Endpoint:** `/process-video`
- **Method:** `POST`
- **Description:** Process videos for transcription, translation, subtitle generation, and combining audio with video.
- **Request Body:**

```json
{
    "s3_bucket": "your_s3_bucket_name",
    "s3_key": "path/to/your/video.mp4",
    "target_language": "en"
}
```

### Example Usage

To process a video, send a POST request to `/process-video` with the required parameters. The backend will handle downloading the video from S3, generating transcripts, translating them, creating subtitles, and combining the audio with the video.

## Additional Documentation

For more detailed information on each utility function and module, refer to the docstrings within the source code files located in the `utils` directory.

- `transcribe.py`: Functions for transcribing video audio using Whisper.
- `translate.py`: Functions for translating transcripts using Vertex AI.
- `generate_srt.py`: Functions for generating SRT subtitle files from transcripts.
- `combine_audio_video.py`: Functions for combining audio and video using FFmpeg.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.