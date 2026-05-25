import * as fs from "node:fs";
import path from "node:path";
import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";
const level = process.env.LOG_LEVEL ?? (isDev ? "debug" : "info");
const logFile = process.env.LOG_FILE_PATH ?? "/logs/app.log";

function canUseFileLogs(filePath: string): boolean {
  try {
    const dir = path.dirname(filePath);
    fs.mkdirSync(dir, { recursive: true });
    fs.accessSync(dir, fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Global Pino logger singleton.
 *
 * Level: controlled by LOG_LEVEL env var (default: "debug" dev, "info" prod).
 *
 * All transports run in a dedicated worker thread via pino.transport(),
 * keeping the main event loop free (Pino's official recommendation).
 *
 * Dev:  pino-pretty → coloured, human-readable stdout.
 * Prod: two targets in parallel —
 *   • pino/file  → /logs/app.log  (Docker volume: ./logs:/logs)
 *   • pino/file  → fd 1 (stdout)  so `docker logs stroygetter` still works
 *
 * Usage:
 *   import { logger } from "@/lib/logger";
 *   const log = logger.child({ module: "my-module" });
 *   log.info({ key: "value" }, "Something happened");
 */
function createTransport() {
  if (isDev) {
    return pino.transport({
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:HH:MM:ss.l",
        // Keep output compact: omit pid/hostname (service already in base)
        ignore: "pid,hostname,service",
        messageFormat: "[{module}] {msg}",
      },
    });
  }

  try {
    const targets: Array<{
      target: string;
      level?: string;
      options: Record<string, unknown>;
    }> = [
      // Mirror to stdout so `docker logs stroygetter` keeps working
      {
        target: "pino/file",
        level,
        options: { destination: 1 }, // fd 1 = stdout
      },
    ];

    if (canUseFileLogs(logFile)) {
      targets.unshift({
        target: "pino-roll",
        options: {
          file: logFile,
          mkdir: true,
          frequency: "daily", // ou size: "50m"
          limit: { count: 14 }, // garde 14 jours
        },
      });
    }

    return pino.transport({
      targets,
    });
  } catch {
    // Build environments may not include optional transports (e.g. pino-roll).
    // Fallback to stdout to keep server module evaluation safe.
    return pino.destination(1);
  }
}

const transport = createTransport();

export const logger = pino(
  {
    level,
    base: { service: "stroygetter" },
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  transport,
);
