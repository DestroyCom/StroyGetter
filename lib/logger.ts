import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Global Pino logger singleton.
 *
 * Level: controlled by LOG_LEVEL env var (default: "debug" dev, "info" prod).
 * Dev: pino-pretty (coloured, human-readable).
 * Prod: raw JSON on stdout — Docker captures it via logging driver.
 *
 * Usage:
 *   import { logger } from "@/lib/logger";
 *   const log = logger.child({ module: "my-module" });
 *   log.info({ key: "value" }, "Something happened");
 */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isDev ? "debug" : "info"),
  base: { service: "stroygetter" },
  transport: isDev
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:HH:MM:ss.l",
          // Keep output compact: omit pid/hostname (service already in base)
          ignore: "pid,hostname,service",
          messageFormat: "[{module}] {msg}",
        },
      }
    : undefined,
  timestamp: pino.stdTimeFunctions.isoTime,
});
