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

  // Change Password (Requires old password check)
  ipcMain.handle(
    "auth-change-password",
    (event, { id, old_password, new_password }) => {
      try {
        const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
        if (!user) return { success: false, error: "User not found." };

        if (hashPassword(old_password) !== user.password_hash) {
          return { success: false, error: "Current password is incorrect." };
        }

        db.prepare("UPDATE users SET password_hash=? WHERE id=?").run(
          hashPassword(new_password),
          id,
        );
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    },
  );

  // Reset Password (By Username for Forgot Password workflow)
  ipcMain.handle("auth-reset-password", (event, { username, newPassword }) => {
    try {
      const user = db
        .prepare("SELECT * FROM users WHERE username = ?")
        .get(username);
      if (!user) return { success: false, error: "Username not found." };

      db.prepare("UPDATE users SET password_hash=? WHERE id=?").run(
        hashPassword(newPassword),
        user.id,
      );
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // Get all users (Exclude password hashes from response)
  ipcMain.handle("auth-get-users", () => {
    try {
      const users = db
        .prepare(
          `SELECT id, username, role, full_name, is_active, created_date, last_login 
           FROM users ORDER BY id DESC`,
        )
        .all();
      return { success: true, users };
    } catch (err) {
      console.error("Error fetching users:", err);
      return { success: false, error: err.message, users: [] };
    }
  });

  // Create new user
  ipcMain.handle("auth-create-user", (e, data) => {
    try {
      const { username, password, role, full_name } = data;
      const hashedPassword = hashPassword(password);

      const stmt = db.prepare(`
        INSERT INTO users (username, password_hash, role, full_name, is_active)
        VALUES (?, ?, ?, ?, 1)
      `);
      const result = stmt.run(
        username,
        hashedPassword,
        role || "cashier",
        full_name || "",
      );

      return { success: true, id: result.lastInsertRowid };
    } catch (err) {
      console.error("Error creating user:", err);
      return {
        success: false,
        error: err.message.includes("UNIQUE")
          ? "Username already exists."
          : err.message,
      };
    }
  });

  // Update existing user
  ipcMain.handle("auth-update-user", (e, { id, data }) => {
    try {
      const { role, full_name, is_active, password } = data;

      if (password && password.trim() !== "") {
        const hashedPassword = hashPassword(password);
        db.prepare(
          `
          UPDATE users 
          SET role = ?, full_name = ?, is_active = ?, password_hash = ?
          WHERE id = ?
        `,
        ).run(role, full_name, is_active ? 1 : 0, hashedPassword, id);
      } else {
        db.prepare(
          `
          UPDATE users 
          SET role = ?, full_name = ?, is_active = ?
          WHERE id = ?
        `,
        ).run(role, full_name, is_active ? 1 : 0, id);
      }

      return { success: true };
    } catch (err) {
      console.error("Error updating user:", err);
      return { success: false, error: err.message };
    }
  });

  // Delete user
  ipcMain.handle("auth-delete-user", (e, id) => {
    try {
      db.prepare(`DELETE FROM users WHERE id = ?`).run(id);
      return { success: true };
    } catch (err) {
      console.error("Error deleting user:", err);
      return { success: false, error: err.message };
    }
  });
}
