import { hashPassword } from "../utils/crypto.js";

export function seedDatabase(db) {
  const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get();

  if (userCount.count === 0) {
    db.prepare(
      `
      INSERT INTO users
      (username, password_hash, role, full_name)
      VALUES (?, ?, ?, ?)
    `,
    ).run("admin", hashPassword("admin123"), "admin", "Administrator");
  }

  const defaultSettings = [
    ["app_name", "ESK TECH"],
    ["language", "en"],
    ["currency", "PKR"],
  ];

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO settings (key, value)
    VALUES (?, ?)
  `);

  defaultSettings.forEach(([key, val]) => {
    stmt.run(key, val);
  });
}
