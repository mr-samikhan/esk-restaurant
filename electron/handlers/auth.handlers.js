import { ipcMain } from "electron";

import { db } from "../db/index.js";
import { hashPassword } from "../utils/crypto.js";

let currentSession = null;

export function registerAuthHandlers() {
  ipcMain.handle("auth-login", (event, payload) => {
    const { username, password } = payload;

    const user = db
      .prepare("SELECT * FROM users WHERE username=? AND is_active=1")
      .get(username);

    if (!user) {
      return {
        success: false,
        error: "Invalid credentials",
      };
    }

    if (hashPassword(password) !== user.password_hash) {
      return {
        success: false,
        error: "Invalid credentials",
      };
    }

    const session = {
      id: user.id,
      username: user.username,
      role: user.role,
    };

    db.prepare(
      `
  INSERT OR REPLACE INTO app_session (id, user_id, username, role)
  VALUES (1, ?, ?, ?)
`,
    ).run(user.id, user.username, user.role);

    return {
      success: true,
      user: session,
    };
  });

  ipcMain.handle("auth-logout", () => {
    db.prepare(
      `
  DELETE FROM app_session WHERE id = 1
`,
    ).run();

    return { success: true };
  });

  ipcMain.handle("auth-get-session", () => {
    const row = db
      .prepare(
        `
    SELECT user_id, username, role
    FROM app_session
    WHERE id = 1
  `,
      )
      .get();

    if (!row) return null;

    return {
      id: row.user_id,
      username: row.username,
      role: row.role,
    };
  });
}
