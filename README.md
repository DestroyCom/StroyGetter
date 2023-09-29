# StroyGetter - An online open source youtube downloader

StroyGetter is a PWA, made with React, which allows to download videos from YouTube.
It use ExpressJS as backend with the help of ytdl-core and ffmpeg.

---

> :warning: **DISCLAIMER**:  
> This program is for personal use only, everything is done for **_educational purposes_**.  
> By using any product of this project (website, application, or code), you agree not to download any video that you do not have the copyright for.
> We _(the contributors of this project)_ cannot be held responsible for anyone using anything that violates [**YouTube's terms of service (https://www.youtube.com/static?template=terms)**](https://www.youtube.com/static?template=terms).

---

## Environment variables

| _Variable name_   | _Description_                             | _Default value_       |
| ----------------- | ----------------------------------------- | --------------------- |
| **CLIENT**        | ----------------------------------------- | --------------------- |
| VITE_ENV_MODE     | The environnement mode of the client      | development           |
| VITE_BACKEND_URL  | The url of the stroygetter API            | http://localhost:3100 |
| **SERVER**        | ----------------------------------------- | --------------------- |
| NODE_ENV          | The environnement mode of the server      | development           |
| SERVER_PORT       | The port of the stroygetter server        | 3100                  |
| CLIENT_URL        | The url of stroygetter client             | http://localhost:3000 |
| **MINIO**         | ----------------------------------------- | --------------------- |
| MINIO_ENDPOINT    | The public endpoint of your minio server  | host.docker.internal  |
| MINIO_PORT        | The port where the minio API served       | 9000                  |
| MINIO_USE_SSL     | If the minio server use https             | false                 |
| MINIO_ACCESS_KEY  | Your MINIO ROOT USERNAME                  | user                  |
| MINIO_SECRET_KEY  | Your MINIO ROOT PASSWORD                  | password              |
| MINIO_BUCKET_NAME | The bucket where the files will be stored | videos                |

---

## Deploys

### Deploy on localhost

#### With Docker

**Make sure you have [Docker](https://www.docker.com/) installed.**

1. Copy the _root_ [.env.example](./.env.example) file to .env and fill in the variables.

2. Start a terminal and run the following commands:

```bash
docker-compose up -d
```

### Without Docker

**Make sure you have [NodeJS](https://nodejs.org/en/) installed and a MINIO server.**

1. At [./stroygetter_front](./stroygetter_front) Copy the [.env.example](./stroygetter_front/.env.example) file to .env and fill in the variables.

2. At [./stroygetter_server](./stroygetter_server) Copy the [.env.example](./stroygetter_server/.env.example) file to .env and fill in the variables.

3. Start a terminal and run the following commands:

   - To start in development mode:

   ```bash
   cd stroygetter_front
   npm install
   npm run dev
   cd ../stroygetter_server
   npm install
   npm run dev
   ```

   - To start in production mode:

   ```bash
   cd stroygetter_front
   npm install
   npm run build
   npm run preview
   cd ../stroygetter_server
   npm install
   npm run build
   npm run start
   ```

---
