# Use an official Python runtime as the base image
FROM python:3.10-slim


# Set the working directory in the container
WORKDIR /app


# Copy the requirements file into the container
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt


COPY . .

# Expose the port that FastAPI will run on
EXPOSE 3003


CMD ["python", "app/main.py"]
