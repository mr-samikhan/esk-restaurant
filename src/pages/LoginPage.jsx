// // src/pages/LoginPage.jsx

// import React, { useState } from "react";
// import { useAuth } from "@/lib/AuthContext";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { Label } from "@/components/ui/label";
// import { ShoppingBag, Eye, EyeOff, AlertCircle } from "lucide-react";
// import { useNavigate } from "react-router-dom";

// export default function LoginPage() {
//   const { login } = useAuth();
//   const navigate = useNavigate();

//   const [username, setUsername] = useState("admin");
//   const [password, setPassword] = useState("admin123");
//   const [showPassword, setShowPassword] = useState(false);
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!username.trim() || !password.trim()) {
//       setError("Please enter both username and password.");
//       return;
//     }
//     setError("");
//     setLoading(true);
//     try {
//       const result = await login({ username, password });
//       if (!result.success) {
//         setError(result.error || "Login failed.");
//       }
//       navigate("/dashboard");
//     } catch (err) {
//       setError("An unexpected error occurred.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div
//       className="fixed inset-0 flex items-center justify-center"
//       style={{
//         background:
//           "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
//       }}
//     >
//       {/* Subtle grid pattern */}
//       <div
//         className="absolute inset-0 opacity-[0.03]"
//         style={{
//           backgroundImage:
//             "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
//           backgroundSize: "40px 40px",
//         }}
//       />

//       {/* Card */}
//       <div
//         className="relative z-10 w-full max-w-sm mx-4"
//         style={{
//           background: "rgba(255,255,255,0.04)",
//           border: "1px solid rgba(255,255,255,0.08)",
//           borderRadius: "20px",
//           backdropFilter: "blur(20px)",
//           boxShadow:
//             "0 32px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)",
//           padding: "40px 36px",
//         }}
//       >
//         {/* Logo */}
//         <div className="flex flex-col items-center mb-8">
//           <div
//             className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
//             style={{
//               background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
//               boxShadow: "0 8px 24px rgba(99,102,241,0.4)",
//             }}
//           >
//             <ShoppingBag className="w-7 h-7 text-white" />
//           </div>
//           <h1
//             className="text-white font-bold tracking-tight"
//             style={{ fontSize: "22px", letterSpacing: "-0.5px" }}
//           >
//             SwiftPOS
//           </h1>
//           <p className="text-slate-400 text-sm mt-1">Sign in to continue</p>
//         </div>

//         {/* Error */}
//         {error && (
//           <div
//             className="flex items-center gap-2 mb-5 px-3 py-2.5 rounded-lg text-sm"
//             style={{
//               background: "rgba(239,68,68,0.12)",
//               border: "1px solid rgba(239,68,68,0.25)",
//               color: "#fca5a5",
//             }}
//           >
//             <AlertCircle className="w-4 h-4 shrink-0" />
//             {error}
//           </div>
//         )}

//         {/* Form */}
//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div className="space-y-1.5">
//             <Label
//               htmlFor="username"
//               className="text-slate-300 text-xs font-medium uppercase tracking-wider"
//             >
//               Username
//             </Label>
//             <input
//               id="username"
//               type="text"
//               autoFocus
//               autoComplete="username"
//               value={username}
//               onChange={(e) => setUsername(e.target.value)}
//               placeholder="Enter your username"
//               className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white placeholder-slate-500 outline-none transition-all"
//               style={{
//                 background: "rgba(255,255,255,0.06)",
//                 border: "1px solid rgba(255,255,255,0.1)",
//                 caretColor: "#818cf8",
//               }}
//               onFocus={(e) => {
//                 e.target.style.border = "1px solid rgba(99,102,241,0.6)";
//                 e.target.style.background = "rgba(255,255,255,0.08)";
//               }}
//               onBlur={(e) => {
//                 e.target.style.border = "1px solid rgba(255,255,255,0.1)";
//                 e.target.style.background = "rgba(255,255,255,0.06)";
//               }}
//             />
//           </div>

//           <div className="space-y-1.5">
//             <Label
//               htmlFor="password"
//               className="text-slate-300 text-xs font-medium uppercase tracking-wider"
//             >
//               Password
//             </Label>
//             <div className="relative">
//               <input
//                 id="password"
//                 type={showPassword ? "text" : "password"}
//                 autoComplete="current-password"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 placeholder="Enter your password"
//                 className="w-full px-3.5 py-2.5 pr-10 rounded-xl text-sm text-white placeholder-slate-500 outline-none transition-all"
//                 style={{
//                   background: "rgba(255,255,255,0.06)",
//                   border: "1px solid rgba(255,255,255,0.1)",
//                   caretColor: "#818cf8",
//                 }}
//                 onFocus={(e) => {
//                   e.target.style.border = "1px solid rgba(99,102,241,0.6)";
//                   e.target.style.background = "rgba(255,255,255,0.08)";
//                 }}
//                 onBlur={(e) => {
//                   e.target.style.border = "1px solid rgba(255,255,255,0.1)";
//                   e.target.style.background = "rgba(255,255,255,0.06)";
//                 }}
//               />
//               <button
//                 type="button"
//                 onClick={() => setShowPassword((v) => !v)}
//                 className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
//                 tabIndex={-1}
//               >
//                 {showPassword ? (
//                   <EyeOff className="w-4 h-4" />
//                 ) : (
//                   <Eye className="w-4 h-4" />
//                 )}
//               </button>
//             </div>
//           </div>

//           <button
//             type="submit"
//             disabled={loading}
//             className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all mt-2"
//             style={{
//               background: loading
//                 ? "rgba(99,102,241,0.5)"
//                 : "linear-gradient(135deg, #6366f1, #8b5cf6)",
//               boxShadow: loading ? "none" : "0 4px 16px rgba(99,102,241,0.35)",
//               cursor: loading ? "not-allowed" : "pointer",
//             }}
//             onMouseEnter={(e) => {
//               if (!loading)
//                 e.target.style.boxShadow = "0 6px 20px rgba(99,102,241,0.5)";
//             }}
//             onMouseLeave={(e) => {
//               if (!loading)
//                 e.target.style.boxShadow = "0 4px 16px rgba(99,102,241,0.35)";
//             }}
//           >
//             {loading ? (
//               <span className="flex items-center justify-center gap-2">
//                 <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
//                 Signing in...
//               </span>
//             ) : (
//               "Sign In"
//             )}
//           </button>
//         </form>

//         {/* Default credentials hint */}
//         <p className="text-center text-slate-600 text-xs mt-6">
//           Default: <span className="text-slate-400">admin</span> /{" "}
//           <span className="text-slate-400">admin123</span>
//         </p>
//       </div>
//     </div>
//   );
// }

// // src/pages/LoginPage.jsx

// import React, { useState } from "react";
// import { useAuth } from "@/lib/AuthContext";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { Label } from "@/components/ui/label";
// import { ShoppingBag, Eye, EyeOff, AlertCircle } from "lucide-react";

// export default function LoginPage() {
//   const { login } = useAuth();
//   const [username, setUsername] = useState("admin");
//   const [password, setPassword] = useState("admin123");
//   const [showPassword, setShowPassword] = useState(false);
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!username.trim() || !password.trim()) {
//       setError("Please enter both username and password.");
//       return;
//     }
//     setError("");
//     setLoading(true);
//     try {
//       const result = await login({ username, password });
//       if (!result.success) {
//         setError(result.error || "Login failed.");
//       }
//     } catch (err) {
//       setError("An unexpected error occurred.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div
//       className="fixed inset-0 flex items-center justify-center"
//       style={{
//         background:
//           "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
//       }}
//     >
//       {/* Subtle grid pattern */}
//       <div
//         className="absolute inset-0 opacity-[0.03]"
//         style={{
//           backgroundImage:
//             "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
//           backgroundSize: "40px 40px",
//         }}
//       />

//       {/* Card */}
//       <div
//         className="relative z-10 w-full max-w-sm mx-4"
//         style={{
//           background: "rgba(255,255,255,0.04)",
//           border: "1px solid rgba(255,255,255,0.08)",
//           borderRadius: "20px",
//           backdropFilter: "blur(20px)",
//           boxShadow:
//             "0 32px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)",
//           padding: "40px 36px",
//         }}
//       >
//         {/* Logo */}
//         <div className="flex flex-col items-center mb-8">
//           <div
//             className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
//             style={{
//               background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
//               boxShadow: "0 8px 24px rgba(99,102,241,0.4)",
//             }}
//           >
//             <ShoppingBag className="w-7 h-7 text-white" />
//           </div>
//           <h1
//             className="text-white font-bold tracking-tight"
//             style={{ fontSize: "22px", letterSpacing: "-0.5px" }}
//           >
//             ESK TECH
//           </h1>
//           <p className="text-slate-400 text-sm mt-1">Sign in to continue</p>
//         </div>

//         {/* Error */}
//         {error && (
//           <div
//             className="flex items-center gap-2 mb-5 px-3 py-2.5 rounded-lg text-sm"
//             style={{
//               background: "rgba(239,68,68,0.12)",
//               border: "1px solid rgba(239,68,68,0.25)",
//               color: "#fca5a5",
//             }}
//           >
//             <AlertCircle className="w-4 h-4 shrink-0" />
//             {error}
//           </div>
//         )}

//         {/* Form */}
//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div className="space-y-1.5">
//             <Label
//               htmlFor="username"
//               className="text-slate-300 text-xs font-medium uppercase tracking-wider"
//             >
//               Username
//             </Label>
//             <input
//               id="username"
//               type="text"
//               autoFocus
//               autoComplete="username"
//               value={username}
//               onChange={(e) => setUsername(e.target.value)}
//               placeholder="Enter your username"
//               className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white placeholder-slate-500 outline-none transition-all"
//               style={{
//                 background: "rgba(255,255,255,0.06)",
//                 border: "1px solid rgba(255,255,255,0.1)",
//                 caretColor: "#818cf8",
//               }}
//               onFocus={(e) => {
//                 e.target.style.border = "1px solid rgba(99,102,241,0.6)";
//                 e.target.style.background = "rgba(255,255,255,0.08)";
//               }}
//               onBlur={(e) => {
//                 e.target.style.border = "1px solid rgba(255,255,255,0.1)";
//                 e.target.style.background = "rgba(255,255,255,0.06)";
//               }}
//             />
//           </div>

//           <div className="space-y-1.5">
//             <Label
//               htmlFor="password"
//               className="text-slate-300 text-xs font-medium uppercase tracking-wider"
//             >
//               Password
//             </Label>
//             <div className="relative">
//               <input
//                 id="password"
//                 type={showPassword ? "text" : "password"}
//                 autoComplete="current-password"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 placeholder="Enter your password"
//                 className="w-full px-3.5 py-2.5 pr-10 rounded-xl text-sm text-white placeholder-slate-500 outline-none transition-all"
//                 style={{
//                   background: "rgba(255,255,255,0.06)",
//                   border: "1px solid rgba(255,255,255,0.1)",
//                   caretColor: "#818cf8",
//                 }}
//                 onFocus={(e) => {
//                   e.target.style.border = "1px solid rgba(99,102,241,0.6)";
//                   e.target.style.background = "rgba(255,255,255,0.08)";
//                 }}
//                 onBlur={(e) => {
//                   e.target.style.border = "1px solid rgba(255,255,255,0.1)";
//                   e.target.style.background = "rgba(255,255,255,0.06)";
//                 }}
//               />
//               <button
//                 type="button"
//                 onClick={() => setShowPassword((v) => !v)}
//                 className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
//                 tabIndex={-1}
//               >
//                 {showPassword ? (
//                   <EyeOff className="w-4 h-4" />
//                 ) : (
//                   <Eye className="w-4 h-4" />
//                 )}
//               </button>
//             </div>
//           </div>

//           <button
//             type="submit"
//             disabled={loading}
//             className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all mt-2"
//             style={{
//               background: loading
//                 ? "rgba(99,102,241,0.5)"
//                 : "linear-gradient(135deg, #6366f1, #8b5cf6)",
//               boxShadow: loading ? "none" : "0 4px 16px rgba(99,102,241,0.35)",
//               cursor: loading ? "not-allowed" : "pointer",
//             }}
//             onMouseEnter={(e) => {
//               if (!loading)
//                 e.target.style.boxShadow = "0 6px 20px rgba(99,102,241,0.5)";
//             }}
//             onMouseLeave={(e) => {
//               if (!loading)
//                 e.target.style.boxShadow = "0 4px 16px rgba(99,102,241,0.35)";
//             }}
//           >
//             {loading ? (
//               <span className="flex items-center justify-center gap-2">
//                 <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
//                 Signing in...
//               </span>
//             ) : (
//               "Sign In"
//             )}
//           </button>
//         </form>

//         {/* Default credentials hint */}
//         <p className="text-center text-slate-600 text-xs mt-6">
//           Default: <span className="text-slate-400">admin</span> /{" "}
//           <span className="text-slate-400">admin123</span>
//         </p>
//       </div>
//     </div>
//   );
// }

// src/pages/LoginPage.jsx

import React, { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  ShoppingBag,
  Eye,
  EyeOff,
  AlertCircle,
  KeyRound,
  CheckCircle2,
  X,
} from "lucide-react";
import { useSettings } from "../hooks/useSettings";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const { login, resetPassword } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();

  // Login State
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Reset Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetUsername, setResetUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const result = await login({ username, password });
      if (!result.success) {
        setError(result.error || "Login failed.");
      }
      navigate("/dashboard");
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setModalError("");
    setModalSuccess("");

    if (
      !resetUsername.trim() ||
      !newPassword.trim() ||
      !confirmPassword.trim()
    ) {
      setModalError("Please fill in all fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setModalError("New password and confirmation do not match.");
      return;
    }

    if (newPassword.length < 4) {
      setModalError("Password must be at least 4 characters long.");
      return;
    }

    setResetLoading(true);
    try {
      // Direct call to resetPassword from AuthContext
      const result = await resetPassword({
        username: resetUsername.trim(),
        newPassword,
      });

      if (result && result.success) {
        setModalSuccess("Password reset successfully! You can now sign in.");
        setTimeout(() => {
          closeModal();
          setUsername(resetUsername.trim());
          setPassword("");
        }, 1500);
      } else {
        setModalError(result?.error || "Failed to reset password.");
      }
    } catch (err) {
      setModalError(
        err.message || "An error occurred while resetting password.",
      );
    } finally {
      setResetLoading(false);
    }
  };

  const closeModal = () => {
    setShowForgotModal(false);
    setResetUsername("");
    setNewPassword("");
    setConfirmPassword("");
    setModalError("");
    setModalSuccess("");
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{
        background:
          "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
      }}
    >
      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Login Card */}
      <div
        className="relative z-10 w-full max-w-sm mx-4"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "20px",
          backdropFilter: "blur(20px)",
          boxShadow:
            "0 32px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)",
          padding: "40px 36px",
        }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              boxShadow: "0 8px 24px rgba(99,102,241,0.4)",
            }}
          >
            <ShoppingBag className="w-7 h-7 text-white" />
          </div>
          <h1
            className="text-white font-bold tracking-tight"
            style={{ fontSize: "22px", letterSpacing: "-0.5px" }}
          >
            {settings?.app_name || "ESK TECH"}
          </h1>
          <p className="text-slate-400 text-sm mt-1">Sign in to continue</p>
        </div>

        {/* Login Error */}
        {error && (
          <div
            className="flex items-center gap-2 mb-5 px-3 py-2.5 rounded-lg text-sm"
            style={{
              background: "rgba(239,68,68,0.12)",
              border: "1px solid rgba(239,68,68,0.25)",
              color: "#fca5a5",
            }}
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label
              htmlFor="username"
              className="text-slate-300 text-xs font-medium uppercase tracking-wider"
            >
              Username
            </Label>
            <input
              id="username"
              type="text"
              autoFocus
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white placeholder-slate-500 outline-none transition-all"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                caretColor: "#818cf8",
              }}
              onFocus={(e) => {
                e.target.style.border = "1px solid rgba(99,102,241,0.6)";
                e.target.style.background = "rgba(255,255,255,0.08)";
              }}
              onBlur={(e) => {
                e.target.style.border = "1px solid rgba(255,255,255,0.1)";
                e.target.style.background = "rgba(255,255,255,0.06)";
              }}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="password"
                className="text-slate-300 text-xs font-medium uppercase tracking-wider"
              >
                Password
              </Label>
              {/* Trigger for Reset Password Modal */}
              <button
                type="button"
                onClick={() => {
                  setResetUsername(username);
                  setShowForgotModal(true);
                }}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-3.5 py-2.5 pr-10 rounded-xl text-sm text-white placeholder-slate-500 outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  caretColor: "#818cf8",
                }}
                onFocus={(e) => {
                  e.target.style.border = "1px solid rgba(99,102,241,0.6)";
                  e.target.style.background = "rgba(255,255,255,0.08)";
                }}
                onBlur={(e) => {
                  e.target.style.border = "1px solid rgba(255,255,255,0.1)";
                  e.target.style.background = "rgba(255,255,255,0.06)";
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all mt-2"
            style={{
              background: loading
                ? "rgba(99,102,241,0.5)"
                : "linear-gradient(135deg, #6366f1, #8b5cf6)",
              boxShadow: loading ? "none" : "0 4px 16px rgba(99,102,241,0.35)",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Default credentials hint */}
        {/* <p className="text-center text-slate-600 text-xs mt-6">
          Default: <span className="text-slate-400">admin</span> /{" "}
          <span className="text-slate-400">admin123</span>
        </p> */}
      </div>

      {/* --- RESET PASSWORD MODAL --- */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div
            className="relative z-10 w-full max-w-sm rounded-2xl p-7 text-white"
            style={{
              background: "rgba(30, 41, 59, 0.85)",
              border: "1px solid rgba(255,255,255,0.12)",
              backdropFilter: "blur(24px)",
              boxShadow:
                "0 32px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)",
            }}
          >
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex flex-col items-center text-center mb-6">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                style={{
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  boxShadow: "0 6px 18px rgba(99,102,241,0.35)",
                }}
              >
                <KeyRound className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-lg font-bold">Reset Password</h2>
              <p className="text-slate-400 text-xs mt-1">
                Enter your username and new password below
              </p>
            </div>

            {/* Error & Success Feedback */}
            {modalError && (
              <div
                className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg text-xs"
                style={{
                  background: "rgba(239,68,68,0.12)",
                  border: "1px solid rgba(239,68,68,0.25)",
                  color: "#fca5a5",
                }}
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                {modalError}
              </div>
            )}

            {modalSuccess && (
              <div
                className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg text-xs"
                style={{
                  background: "rgba(16,185,129,0.12)",
                  border: "1px solid rgba(16,185,129,0.25)",
                  color: "#6ee7b7",
                }}
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                {modalSuccess}
              </div>
            )}

            {/* Reset Password Form */}
            <form onSubmit={handleResetPassword} className="space-y-3.5">
              <div className="space-y-1">
                <Label className="text-slate-300 text-xs font-medium uppercase tracking-wider">
                  Username
                </Label>
                <input
                  type="text"
                  value={resetUsername}
                  onChange={(e) => setResetUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full px-3.5 py-2 rounded-xl text-sm text-white placeholder-slate-500 outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                  onFocus={(e) => {
                    e.target.style.border = "1px solid rgba(99,102,241,0.6)";
                  }}
                  onBlur={(e) => {
                    e.target.style.border = "1px solid rgba(255,255,255,0.1)";
                  }}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-slate-300 text-xs font-medium uppercase tracking-wider">
                  New Password
                </Label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full px-3.5 py-2 pr-10 rounded-xl text-sm text-white placeholder-slate-500 outline-none transition-all"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                    onFocus={(e) => {
                      e.target.style.border = "1px solid rgba(99,102,241,0.6)";
                    }}
                    onBlur={(e) => {
                      e.target.style.border = "1px solid rgba(255,255,255,0.1)";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    tabIndex={-1}
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-slate-300 text-xs font-medium uppercase tracking-wider">
                  Confirm Password
                </Label>
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full px-3.5 py-2 rounded-xl text-sm text-white placeholder-slate-500 outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                  onFocus={(e) => {
                    e.target.style.border = "1px solid rgba(99,102,241,0.6)";
                  }}
                  onBlur={(e) => {
                    e.target.style.border = "1px solid rgba(255,255,255,0.1)";
                  }}
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="w-1/2 py-2 rounded-xl text-xs font-semibold text-slate-300 transition-all"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-1/2 py-2 rounded-xl text-xs font-semibold text-white transition-all flex items-center justify-center"
                  style={{
                    background: resetLoading
                      ? "rgba(99,102,241,0.5)"
                      : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
                  }}
                >
                  {resetLoading ? (
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Update Password"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
