# Embedding Service - Docker Setup

## Build the Docker Image
Run the following command to build the Docker image without using the cache:
```sh
docker build --no-cache -t embedding-service:latest .
```

## Run the Docker Container
Use the following command to run the container, ensuring it uses the environment variables from `docker.env`:
```sh
docker run --env-file docker.env -p 3003:3003 embedding-service:latest
```
