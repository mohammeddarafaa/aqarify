# Static SPA — build from repository root:
#   docker build -f aqarify/client/Dockerfile .
FROM node:22-alpine AS build
WORKDIR /src
COPY aqarify/package.json aqarify/package-lock.json ./aqarify/
WORKDIR /src/aqarify
RUN npm ci
COPY aqarify/client ./client
RUN npm run build --prefix client

FROM nginx:1.27-alpine
COPY --from=build /src/aqarify/client/dist /usr/share/nginx/html
COPY aqarify/client/nginx-spa.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
