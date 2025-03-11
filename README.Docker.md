### Building and running your application

This application uses Caddy as a web server within the Docker container. The container is built with Astro v5.4.3 and Tailwind CSS v4 for optimal performance.

-- If you have issues building multi-platform:
```
docker buildx create --name mybuilder --use --driver docker-container
docker buildx inspect --bootstrap
docker buildx ls
docker buildx build --platform linux/arm64,linux/amd64,linux/arm/v6,linux/arm/v7 -t [repo]/[image-name]:[tag] . --push
```

Your application will be available at port `4321` if you're using another reverse proxy to connect to the container, if exposing the container directly then use port 80/443 since Caddy will be serving the content.

The Docker image is configured in compose.yaml and built using the Dockerfile in the project root.
