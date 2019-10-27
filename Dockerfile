USER nginx:nginx

FROM nginx:1.17.3-alpine
COPY nginx.conf /etc/nginx/nginx.conf
COPY target /usr/share/nginx/html