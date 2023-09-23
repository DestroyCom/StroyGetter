import fs from "fs";
import path from "path";
import Database from "better-sqlite3";

if (!fs.existsSync(path.join(__dirname, "../database"))) {
  fs.mkdirSync(path.join(__dirname, "../database"));
  fs.chmodSync(path.join(__dirname, "../database"), 0o777);
}

const db = new Database(path.join(__dirname, "../database/stroygetter.db"), {
  verbose: console.log,
});
db.pragma("journal_mode = WAL");

// Create tables
db.exec(`
    CREATE TABLE IF NOT EXISTS videos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ytbe_id TEXT NOT NULL,
        quality TEXT NOT NULL,
        minio_path TEXT NOT NULL);`);

export default db;

export const insertVideo = async (
  ytbe_id: string,
  quality: string,
  minio_path: string
) => {
  const stmt = db.prepare(
    "INSERT INTO videos (ytbe_id, quality, minio_path) VALUES (?, ?, ?)"
  );
  stmt.run(ytbe_id, quality, minio_path);
};

export const getVideo = async (ytbe_id: string, quality: string) => {
  const stmt = db.prepare(
    "SELECT * FROM videos WHERE ytbe_id = ? AND quality = ?"
  );
  return await stmt.get(ytbe_id, quality);
};
