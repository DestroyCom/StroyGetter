import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@prisma/client";

const DEFAULT_DB_URL =
  process.env.NODE_ENV === "production"
    ? "file:/temp/stroygetter/database/prod.db"
    : "file:./database/dev.db";

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL ?? DEFAULT_DB_URL,
});

export const prisma = new PrismaClient({ adapter });
