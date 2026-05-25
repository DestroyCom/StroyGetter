import { AsyncLocalStorage } from "node:async_hooks";
import { createHash, randomUUID } from "node:crypto";
import type { Logger } from "pino";
import { logger } from "./logger";

interface RequestContext {
  reqId: string;
  ipHash: string;
  log: Logger;
}

const store = new AsyncLocalStorage<RequestContext>();

/**
 * Hash an IP address so it's never stored/logged in plain text (GDPR).
 * Returns the first 10 hex chars of the SHA-256 — enough to spot repeated
 * offenders without being reversible.
 */
export function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 10);
}

/** Generate a short, URL-safe request ID (8 hex chars). */
export function generateReqId(): string {
  return randomUUID().replace(/-/g, "").slice(0, 8);
}

/**
 * Wrap `fn` in an async context that carries a request-scoped logger.
 * Every `getLog()` call inside `fn` (and any function it awaits) will
 * automatically include `reqId` and `ipHash` in the log record.
 */
export function runWithRequestContext<T>(reqId: string, ipHash: string, fn: () => T): T {
  const log = logger.child({ reqId, ipHash });
  return store.run({ reqId, ipHash, log }, fn);
}

/**
 * Get the current request-scoped logger.
 *
 * @param module  Optional module label added as `module` field.
 *                Pass the same string you use as `[prefix]` in old console calls.
 *
 * Falls back to the root logger (without reqId) when called outside a
 * request context (e.g. from a cron job).
 */
export function getLog(module?: string): Logger {
  const base = store.getStore()?.log ?? logger;
  return module ? base.child({ module }) : base;
}

/** Returns the current request ID, or undefined outside a request context. */
export function getReqId(): string | undefined {
  return store.getStore()?.reqId;
}
