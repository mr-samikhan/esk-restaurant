import { db } from "../db/index.js";
import path from "path";
import fs from "fs";
import { app, ipcMain, shell } from "electron";

export function autoBackupHandlers() {
  //auto backup
  // Path to auto_backups folder
  const BACKUP_DIR = path.join(app.getPath("userData"), "auto_backups");

  // Ensure auto_backups directory exists
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  // IPC Handler: Safe Auto-Backup via better-sqlite3 engine
  ipcMain.handle(
    "create-auto-backup",
    async (event, { fileName, retentionDays = 7 }) => {
      try {
        const destDb = path.join(BACKUP_DIR, fileName);

        // 1. Perform safe SQLite online backup snapshot
        await db.backup(destDb);

        // 2. Enforce retention policy (Delete backups older than retentionDays)
        const files = fs.readdirSync(BACKUP_DIR);
        const now = Date.now();
        const maxAgeMs = retentionDays * 24 * 60 * 60 * 1000;

        files.forEach((file) => {
          if (file.endsWith(".db")) {
            const filePath = path.join(BACKUP_DIR, file);
            const stats = fs.statSync(filePath);
            if (now - stats.mtimeMs > maxAgeMs) {
              fs.unlinkSync(filePath);
            }
          }
        });

        console.log(`[Auto-Backup] Successfully written to: ${destDb}`);
        return { success: true, path: destDb };
      } catch (error) {
        console.error("[Auto-Backup Failed]:", error.message);
        return { success: false, error: error.message };
      }
    },
  );

  // 2. IPC Handler: List Stored Backups
  ipcMain.handle("get-auto-backups", async () => {
    try {
      if (!fs.existsSync(BACKUP_DIR)) return [];

      const files = fs.readdirSync(BACKUP_DIR);
      return files
        .filter((file) => file.endsWith(".db"))
        .map((file) => {
          const stats = fs.statSync(path.join(BACKUP_DIR, file));
          return {
            name: file,
            size: (stats.size / (1024 * 1024)).toFixed(2) + " MB",
            createdAt: stats.mtime.toISOString(),
          };
        })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch {
      return [];
    }
  });

  ipcMain.handle("open-backup-folder", async () => {
    const backupPath = path.join(app.getPath("userData"), "auto_backups");
    await shell.openPath(backupPath);
  });
  //end of auto backup
}
