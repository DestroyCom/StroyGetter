# StroyGetter - An online open source video downloader

StroyGetter is a website, made with NextJS, which allows to download videos.
You can access it at [https://stroygetter.stroyco.eu](https://stroygetter.stroyco.eu).

---

> :warning: **DISCLAIMER**:  
> This program is for personal use only, everything is done for **_educational purposes_**.  
> By using any product of this project (website, application, or code), you agree not to download any video that you do not have the copyright for.
> We _(the contributors of this project)_ cannot be held responsible for anyone using anything that violates some terms of service from any platform.

---

## Deploys

### Deploy on localhost

#### With Docker

**Make sure you have [Docker](https://www.docker.com/) installed.**

1. Start a terminal and run the following commands:

```bash
docker-compose up -d
```

### Without Docker

**Make sure you have [NodeJS](https://nodejs.org/en/) installed.**

1. Start a terminal and run the following commands:

   - To start in development mode:

   ```bash
    npm install
    npm run dev
   ```

   - To start in production mode:

   ```bash
    npm ci
    npm run build
    node .next/standalone/server.js
   ```

---

<!--
## The StroyGetter Extension

The StroyGetter extension is a chrome (and Edge) extension that allows you to get a quick access from YouTube.

### Installation

1. Download the stroygetter_extension.zip inside the [latest release (https://github.com/DestroyCom/StroyGetter/releases)](https://github.com/DestroyCom/StroyGetter/releases/latest) and unzip it.
2. Go to [chrome://extensions/](chrome://extensions/) and activate the developer mode.
3. Click on "Load unpacked" and select the folder of the extension.
4. Go to [youtube.com](https://www.youtube.com/) and enjoy.

---
-->
