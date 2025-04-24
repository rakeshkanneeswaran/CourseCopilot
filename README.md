## **Course-Copilot (Version 2)**



Course-Copilot enables users to **convert an entire playlist into multiple languages** while **generating transcripts** for each language. After processing the playlist, a **vector database** is created for each playlist, allowing users to interact with an **AI-powered chatbot**.  

The chatbot utilizes **Retrieval-Augmented Generation (RAG)** to answer questions based on the processed video content, ensuring accurate and context-aware responses.  



## **System Design & Workflow**
<img width="1385" alt="Screenshot 2025-03-19 at 8 44 52 AM" src="https://github.com/user-attachments/assets/450b26ab-7513-464b-acd7-aad7c95cf2c0" />
CEHOLDER_FOR_SYSTEM_DESIGN_DIAGRAM)


## **Tech Stack**  
This project comprises an integration of multiple technologies. The mainly web app and background-job-service  jobs are written in **TypeScript**, while other services such as the **intelligent-service  (RAG chatbot), embeddings-service, and video-processing-service** are implemented in **Python**. For infrastructure, **Terraform** is used to create an **S3 bucket** for data storage.

To facilitate communication between microservices, **Apache Kafka** is used to enable distributed computing. For storing the details of projects, **PostgreSQ**L is used, accessed via **Prisma**.


## Folder Structure
```
├── web-app/ # Frontend application (Next.js)
├── background-job/-service # Manages Kafka-triggered tasks and distributes them to other services
├── video-processing-service # Handles video translation and transcription using Whisper & FFmpeg 
├── embedding-service/ # Processes course content, generates vector embeddings, and stores them in S3 
├── intelligence-service/ # LangChain-powered AI assistant that queries the vector database 
├── infrastructure/ # Terraform scripts for provisioning AWS S3 and other infrastructure 
├── docker-compose.yml # Docker Compose configuration to orchestrate all services
```
Each service contains a **Dockerfile** to enable containerization, and the `docker-compose.yml` in the main directory helps start all services together.

## Setup & Installation
### Prerequisites
- Node.js (v16+)
- Docker (for running microservices)
- AWS S3 account (for storage)
- Kafka setup

### Installation
1. **Clone the repository:**  
   ```sh
   git clone https://github.com/rakeshkanneeswaran/CourseCopilot.git
   cd CourseCopilot
   ```  
2. **Install dependencies:**  
   Each microservice contains its own `setup.md` file with installation instructions.  

3. **Configure environment variables:**  
   - Create `.env` and `docker.env` files based on `.env.example` and `docker.env.example`.  

4. **Start all services using Docker Compose:**  
   ```sh
   docker-compose up --build
   ```

