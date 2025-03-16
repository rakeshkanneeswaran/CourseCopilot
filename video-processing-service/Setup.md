# Setup Guide for Video Processor Docker Image

This guide provides step-by-step instructions for setting up and running the Docker image for the video processor application. The application uses Google Application Default Credentials (ADC) for authentication, FFmpeg for video processing, and Whisper for transcript generation.

## Prerequisites
Before you begin, ensure you have the following installed:

- **Docker**: [Install Docker](https://docs.docker.com/get-docker/)
- **Google Cloud SDK** (optional, for generating ADC credentials): [Install Google Cloud SDK](https://cloud.google.com/sdk/docs/install)

## Setup Instructions

### 1. Clone the Repository
Clone the repository containing the video processor code:

```bash
git clone <repository_url>
cd <repository_directory>
```

### 2. Set Up Google Application Default Credentials (ADC)
The application uses Google ADC for authentication. ADC searches for credentials in the following locations:

- **GOOGLE_APPLICATION_CREDENTIALS environment variable**:
  Set this variable to point to your Google Cloud credentials JSON file.

- **A credential file created by `gcloud auth application-default login`**:
  Run the following command to generate a credentials file:

```bash
gcloud auth application-default login <email>
```

This will create a credentials file in the default location (e.g., `~/.config/gcloud/application_default_credentials.json`).

### 3. Build the Docker Image
Build the Docker image using the provided Dockerfile:

```bash
docker build -t video-processor .
```

### 4. Run the Docker Container
Run the Docker container with the necessary environment variables and port mappings:

```bash
docker run -p 3002:3002 video-processor
```

## Environment Variables
- `GOOGLE_APPLICATION_CREDENTIALS`: Path to the Google ADC credentials file inside the container.
- `AWS_ACCESS_KEY_ID` (optional): AWS access key for S3 integration.
- `AWS_SECRET_ACCESS_KEY` (optional): AWS secret key for S3 integration.
- `AWS_BUCKET` (optional): AWS S3 bucket name.

## Volume Mounts
Mount the Google ADC credentials file into the container using the `-v` flag:

```bash
docker run -p 3002:3002 video-processor
```

This ensures that the credentials are accessible inside the container for authentication purposes.

