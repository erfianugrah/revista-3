### Building and running your application

-- If you have issues building multi-platform:
```
docker buildx create --name mybuilder --use --driver docker-container
docker buildx inspect --bootstrap
docker buildx ls
docker buildx build --platform linux/arm64,linux/amd64,linux/arm/v6,linux/arm/v7 -t [repo]/[image-name]:[tag] . --push
```

Your application will be available at http://localhost:4321.
