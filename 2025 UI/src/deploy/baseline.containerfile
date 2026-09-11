FROM docker.io/library/nginx:1.27.4
LABEL org.opencontainers.image.authors="ricardo.mook@uni-oldenburg.de"

COPY ./src/deploy/nginx.conf /etc/nginx/nginx.conf
COPY ./dist /usr/share/nginx/www/smart-hotel

EXPOSE 80
