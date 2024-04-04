### Building and running your application

-- If you have issues building multi-platform:
```
docker buildx create --name mybuilder --use --driver docker-container
docker buildx inspect --bootstrap
docker buildx ls
docker buildx build --platform=linux/arm64,linux/amd64 -t erfianugrah/revista-4:1.1.3 . --push

```

Your application will be available at http://localhost:80.
