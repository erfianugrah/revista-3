FROM busybox:1.37
COPY dist /var/www
CMD ["httpd", "-f", "-p", "80", "-h", "/var/www"]
EXPOSE 80
