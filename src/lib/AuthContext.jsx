import React, { createContext, useState, useContext, useEffect } from "react";
import { dbService } from "@/lib/db-service";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true); // true on boot

  // On app start, check if a session already exists (e.g. app restarted)
  useEffect(() => {
    const restore = async () => {
      try {
        const session = await dbService.getSession();
        if (session) {
          setUser(session);
          setIsAuthenticated(true);
        }
      } catch (_) {
        // no session
      } finally {
        setIsLoadingAuth(false);
      }
    };
    restore();
  }, []);

  const login = async ({ username, password }) => {
    const result = await dbService.login({ username, password });
    if (result.success) {
      setUser(result.user);
      setIsAuthenticated(true);
    }
    return result; // caller handles error display
  };

  const logout = async () => {
    await dbService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  /**
   * Change password for the currently logged-in user (requires old password verification)
   */
  const changePassword = async ({ old_password, new_password }) => {
    if (!user?.id) {
      return { success: false, error: "No active user session." };
    }

    // Call your Electron IPC/dbService handler
    const result = await dbService.changePassword({
      id: user.id,
      old_password,
      new_password,
    });

    return result;
  };

  /**
   * Reset password for any user by username (used by the Forgot Password modal)
   */
  const resetPassword = async ({ username, newPassword }) => {
    // Call your Electron IPC/dbService handler
    const result = await dbService.resetPassword({
      username,
      newPassword,
    });

    return result;
  };

  console.log("current user", user);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings: false,
        authError: null,
        appPublicSettings: { id: "local", public_settings: {} },
        login,
        logout,
        changePassword,
        resetPassword,
        navigateToLogin: () => {},
        checkAppState: async () => true,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
