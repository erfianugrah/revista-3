FROM busybox:1.38
COPY dist /var/www
CMD ["httpd", "-f", "-p", "80", "-h", "/var/www"]
EXPOSE 80
