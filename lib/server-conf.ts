import { initializeConf } from "@/lib/serverUtils";

const CONF = { isInitialized: false, ffmpegPath: "" };
let _initPromise: Promise<void> | null = null;

export async function getServerConf(): Promise<{ ffmpegPath: string }> {
  if (!CONF.isInitialized) {
    if (!_initPromise) {
      _initPromise = initializeConf(CONF)
        .then(() => {})
        .catch((err) => {
          _initPromise = null;
          throw err;
        });
    }
    await _initPromise;
  }
  return { ffmpegPath: CONF.ffmpegPath };
}
