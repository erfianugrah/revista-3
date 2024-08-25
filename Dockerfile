FROM caddy:2.8.4-alpine

# Set the working directory
WORKDIR /usr/share/caddy

# Copy the built Astro site
COPY ./dist .

# Copy the Caddyfile
COPY Caddyfile /etc/caddy/Caddyfile

# Ensure correct permissions (using root, which is the default user in this image)
RUN chown -R root:root /usr/share/caddy && \
	chmod -R 755 /usr/share/caddy

# Expose port 80
EXPOSE 80

# Start Caddy
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
