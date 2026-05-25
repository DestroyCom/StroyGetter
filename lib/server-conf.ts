import { logger } from "@/lib/logger";
import { initializeConf } from "@/lib/serverUtils";

const log = logger.child({ module: "server-conf" });

const CONF = { isInitialized: false, ffmpegPath: "" };
let _initPromise: Promise<void> | null = null;

export async function getServerConf(): Promise<{ ffmpegPath: string }> {
  if (!CONF.isInitialized) {
    if (!_initPromise) {
      log.debug("Server conf not initialised — starting init");
      _initPromise = initializeConf(CONF)
        .then(() => {
          log.info({ ffmpegPath: CONF.ffmpegPath }, "Server initialised");
        })
        .catch((err) => {
          log.fatal({ err }, "Server initialisation failed — ffmpeg or temp dir unavailable");
          _initPromise = null;
          throw err;
        });
    } else {
      log.debug("Server conf init already in progress — waiting");
    }
    await _initPromise;
  }
  return { ffmpegPath: CONF.ffmpegPath };
}
