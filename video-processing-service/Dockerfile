# Use an official Python runtime as the base image
FROM python:3.12.9

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    git \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Install dependencies
RUN python -c "import whisper; whisper.load_model('base')"

# Copy application code
COPY . .

# Copy Google ADC credentials
COPY /app/application_default_credentials.json /app/application_default_credentials.json

# Set environment variables
ENV GOOGLE_APPLICATION_CREDENTIALS=/app/application_default_credentials.json


# Expose the port that FastAPI will run on
EXPOSE 3002

# Command to run the application
CMD ["python", "app/main.py"]