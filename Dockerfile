FROM nginx:1.17.3-alpine
COPY nginx.conf /etc/nginx/nginx.conf
COPY . /usr/share/nginx/html