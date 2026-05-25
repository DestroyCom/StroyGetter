"use server";

import fs from "node:fs";
import cron from "node-cron";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

const log = logger.child({ module: "cleanup" });

const DEFAULT_CLEANUP_INTERVAL = process.env.NODE_ENV === "production" ? "7" : "1";
const CLEANUP_INTERVAL = process.env.CLEANUP_INTERVAL || DEFAULT_CLEANUP_INTERVAL;
const INTERVAL_DAYS = parseInt(CLEANUP_INTERVAL, 10);

const DEFAULT_CRON = process.env.NODE_ENV === "production" ? "0 0 * * *" : "*/1 * * * *";
const CRON = process.env.CRON || DEFAULT_CRON;

export const initializeCleanup = async () => {
  log.info({ schedule: CRON, retentionDays: INTERVAL_DAYS }, "Cleanup cron scheduled");

  cron.schedule(CRON, async () => {
    const jobStart = Date.now();
    log.info({ retentionDays: INTERVAL_DAYS }, "Cleanup job started");

    let filesDeleted = 0;
    let filesSkipped = 0;
    let dbRecordsDeleted = 0;
    let dbRecordsFailed = 0;

    try {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() - INTERVAL_DAYS);

      const oldFiles = await prisma.file.findMany({
        where: { createdAt: { lt: expirationDate } },
        include: { video: { select: { title: true } } },
      });

      log.info(
        { count: oldFiles.length, olderThan: expirationDate.toISOString() },
        "Stale files found for cleanup"
      );

      for (const file of oldFiles) {
        // ── File deletion ──────────────────────────────────────────────
        let unlinkOk = false;
        try {
          await fs.promises.unlink(file.path);
          unlinkOk = true;
          filesDeleted++;
          log.debug({ fileId: file.id, path: file.path }, "File deleted");
        } catch (err) {
          if ((err as NodeJS.ErrnoException).code === "ENOENT") {
            // File already gone — still clean up the DB record
            unlinkOk = true;
            filesSkipped++;
            log.debug(
              { fileId: file.id, path: file.path },
              "File already absent on disk — cleaning DB record"
            );
          } else {
            filesSkipped++;
            log.error({ fileId: file.id, path: file.path, err }, "Failed to delete file");
          }
        }

        if (!unlinkOk) continue;

        // ── DB record deletion ─────────────────────────────────────────
        try {
          await prisma.file.delete({ where: { id: file.id } });
          dbRecordsDeleted++;
        } catch (err) {
          dbRecordsFailed++;
          log.error({ fileId: file.id, path: file.path, err }, "Failed to delete DB record");
        }
      }
    } catch (err) {
      log.error(
        { err, durationMs: Date.now() - jobStart },
        "Cleanup job encountered a fatal error"
      );
    } finally {
      log.info(
        {
          filesDeleted,
          filesSkipped,
          dbRecordsDeleted,
          dbRecordsFailed,
          durationMs: Date.now() - jobStart,
        },
        "Cleanup job finished"
      );
    }
  });
};
