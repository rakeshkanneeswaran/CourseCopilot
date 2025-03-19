# AI-Powered Learning Platform

## Overview
This project is an AI-powered platform that offers:
- **Automatic Video Translation & Transcription**
- **Smart Test Generation**
- **Interactive AI Assistant** for every course

It leverages advanced AI models for seamless learning experiences, enabling users to upload course videos and interact with AI-generated content.

## Features
- **AI-Powered Transcription & Translation**: Uses Whisper & FFmpeg for high-quality processing.
- **Smart Test Generation**: Generates quizzes based on video content.
- **AI Assistant**: Uses Hugging Face & LangChain to answer course-related queries.
- **Real-time Updates**: WebSocket-based communication ensures a smooth user experience.

## System Design


## Tech Stack
- **Frontend**: Next.js
- **Backend**: Node.js,
- **Message Queue**: Kafka
- **Storage**: AWS S3
- **AI Processing**:
  - Whisper (Transcription & Translation)
  - FFmpeg (Video Processing)
  - Hugging Face (Embedding & AI Assistant)
  - LangChain (Query Processing)

## Folder Structure
```
├── infrastructure/        # Terraform scripts for AWS S3 bucket setup
├── intelligence-service/  # LangChain & AI-powered assistant service
├── embedding-service/     # Embedding vector service using Hugging Face
├── web-app/               # Frontend application (Next.js)
├── background-job/        # Handles Kafka-triggered background tasks
├── video-processor/       # Video processing service using FFmpeg & Whisper
├── docker-compose.yml     # Docker Compose file to orchestrate all services
```
Each service contains a **Dockerfile** to enable containerization, and the `docker-compose.yml` in the main directory helps start all services together.

## Workflow
1. **User uploads a video**, which is stored in AWS S3.
2. **Kafka triggers background jobs** to process the video.
3. **Transcription & translation are performed** using Whisper & FFmpeg.
4. **Embedding service generates vector data** and stores it.
5. **AI Assistant loads vector data** and provides intelligent responses.

## Setup & Installation
### Prerequisites
- Node.js (v16+)
- Docker (for running microservices)
- AWS S3 account (for storage)
- Kafka setup

### Installation
1. Clone the repository:
   ```sh
   git clone https://github.com/rakeshkanneeswaran/EduVerseAI.git
   cd your-repo
   ```
2. Install dependencies:
   ```sh
   pnpm install
   ```
3. Configure environment variables:
   - Create a `.env` file based on `.env.example`
4. Start all services using Docker Compose:
   ```sh
   docker-compose up --build
   ```

## Contribution
Feel free to contribute by submitting issues or pull requests. 🚀

## License
This project is licensed under the MIT License.

