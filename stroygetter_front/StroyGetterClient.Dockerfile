FROM node:lts-alpine as builder

WORKDIR /app

ARG VITE_BACKEND_URL
ARG VITE_ENV_MODE
ENV VITE_BACKEND_URL=${VITE_BACKEND_URL}
ENV VITE_ENV_MODE=${VITE_ENV_MODE}

#Echoing the env vars for debugging purposes
RUN echo "VITE_BACKEND_URL: ${VITE_BACKEND_URL}"
RUN echo "VITE_ENV_MODE: ${VITE_ENV_MODE}"

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine as runner

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf