# Web App - Docker Setup

## Build the Docker Image
Run the following command to build the Docker image, passing the WebSocket URL as a build argument:
```sh
docker build --no-cache --build-arg NEXT_PUBLIC_AI_WEB_SOCKET_URL=ws://localhost:3004/ws -t web-app:latest .
```

## Run the Docker Container
Use the following command to run the container, ensuring it uses the environment variables from `docker.env`:
```sh
docker run --env-file docker.env -p 3000:3000 web-app:latest
```
