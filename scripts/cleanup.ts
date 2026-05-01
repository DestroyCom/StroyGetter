"use server";

import fs from "node:fs";
import cron from "node-cron";
import { prisma } from "@/lib/prisma";

const DEFAULT_CLEANUP_INTERVAL = process.env.NODE_ENV === "production" ? "7" : "1";
const CLEANUP_INTERVAL = process.env.CLEANUP_INTERVAL || DEFAULT_CLEANUP_INTERVAL;

const DEFAULT_CRON = process.env.NODE_ENV === "production" ? "0 0 * * *" : "*/1 * * * *";
const CRON = process.env.CRON || DEFAULT_CRON;

export const initializeCleanup = async () => {
  cron.schedule(CRON, async () => {
    try {
      console.log("Starting cleanup...");
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() - parseInt(CLEANUP_INTERVAL, 10));

      const oldFiles = await prisma.file.findMany({
        where: {
          createdAt: {
            lt: expirationDate,
          },
        },
      });

      for (const file of oldFiles) {
        let unlinkOk = false;
        try {
          await fs.promises.unlink(file.path);
          unlinkOk = true;
        } catch (err) {
          if ((err as NodeJS.ErrnoException).code === "ENOENT") {
            unlinkOk = true;
          } else {
            console.error(`Failed to delete file ${file.path}:`, err);
          }
        }
        if (!unlinkOk) continue;
        try {
          await prisma.file.delete({ where: { id: file.id } });
        } catch (err) {
          console.error(`Failed to delete DB record ${file.id}:`, err);
        }
      }
    } catch (error) {
      console.error("Error during cleanup:", error);
    } finally {
      console.log("Cleanup finished.");
    }
  });
};
