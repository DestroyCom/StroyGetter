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
      expirationDate.setDate(expirationDate.getDate() - parseInt(CLEANUP_INTERVAL));

      const oldFiles = await prisma.file.findMany({
        where: {
          createdAt: {
            lt: expirationDate,
          },
        },
      });

      for (const file of oldFiles) {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
        await prisma.file.delete({ where: { id: file.id } });
      }
    } catch (error) {
      console.error("Error during cleanup:", error);
    } finally {
      console.log("Cleanup finished.");
    }
  });
};
