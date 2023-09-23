FROM node:lts-alpine as build

WORKDIR /build
RUN apk update && apk add ffmpeg

COPY package*.json ./
RUN npm install
COPY . .

RUN npm run build

FROM node:lts-alpine
ENV NODE_ENV=production

WORKDIR /app
RUN apk update && apk add ffmpeg

COPY --from=build /build/dist ./dist
COPY --from=build /build/package*.json ./
RUN npm install

CMD ["npm","run","start"]