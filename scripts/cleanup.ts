"use server";

import { PrismaClient } from "@prisma/client";
import cron from "node-cron";
import fs from "fs";

const DEFAULT_CLEANUP_INTERVAL =
  process.env.NODE_ENV === "production" ? "7" : "1";
const CLEANUP_INTERVAL =
  process.env.CLEANUP_INTERVAL || DEFAULT_CLEANUP_INTERVAL;

const DEFAULT_CRON =
  process.env.NODE_ENV === "production" ? "0 0 * * *" : "*/1 * * * *";
const CRON = process.env.CRON || DEFAULT_CRON;

export const initializeCleanup = async () => {
  cron.schedule(CRON, async () => {
    const prisma = new PrismaClient();

    try {
      console.log("Starting cleanup...");
      const expirationDate = new Date();
      expirationDate.setDate(
        expirationDate.getDate() - parseInt(CLEANUP_INTERVAL)
      );

      const oldFiles = await prisma.file.findMany({
        where: {
          createdAt: {
            lt: expirationDate,
          },
        },
      });

      for (const file of oldFiles) {
        const filePath = file.path;

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);

          await prisma.file.delete({
            where: {
              id: file.id,
            },
          });
        }
      }
    } catch (error) {
      console.error("Error during cleanup:", error);
    } finally {
      console.log("Cleanup finished.");
      await prisma.$disconnect();
    }
  });
};
