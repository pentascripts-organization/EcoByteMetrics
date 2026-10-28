FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_BACKEND_URL=/backend
ARG VITE_CARBON_URL=https://carbon.unilaunch.org
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
ENV VITE_CARBON_URL=$VITE_CARBON_URL
RUN npm run build

FROM nginx:stable-alpine
ENV BACKEND_PROXY_TARGET=http://backend:3000
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
ARG PGPORT

ENV PGPORT=$PGPORT

EXPOSE $PGPORT
