import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";
const level = process.env.LOG_LEVEL ?? (isDev ? "debug" : "info");

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
const transport = isDev
  ? pino.transport({
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:HH:MM:ss.l",
        // Keep output compact: omit pid/hostname (service already in base)
        ignore: "pid,hostname,service",
        messageFormat: "[{module}] {msg}",
      },
    })
  : pino.transport({
      targets: [
        // Persist to file — requires Docker volume: ./logs:/logs
        {
          target: "pino/file",
          level,
          options: {
            destination: "/logs/app.log",
            append: true,
            mkdir: true, // creates /logs if missing (graceful first-boot)
          },
        },
        // Mirror to stdout so `docker logs stroygetter` keeps working
        {
          target: "pino/file",
          level,
          options: { destination: 1 }, // fd 1 = stdout
        },
      ],
    });

export const logger = pino(
  {
    level,
    base: { service: "stroygetter" },
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  transport,
);
