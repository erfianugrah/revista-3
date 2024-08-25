FROM caddy:2.8.4-alpine

# Set the working directory
WORKDIR /usr/share/caddy

# Copy the built Astro site
COPY ./dist .

# Copy the Caddyfile
COPY Caddyfile /etc/caddy/Caddyfile

# Ensure correct permissions
RUN chown -R caddy:caddy /usr/share/caddy

# Use the non-root caddy user
USER caddy

# Expose port 80
EXPOSE 80

# Start Caddy
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
