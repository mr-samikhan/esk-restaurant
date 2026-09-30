// src/pages/LoginPage.jsx

import React, { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ShoppingBag, Eye, EyeOff, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
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

      {/* Card */}
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
            SwiftPOS
          </h1>
          <p className="text-slate-400 text-sm mt-1">Sign in to continue</p>
        </div>

        {/* Error */}
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

        {/* Form */}
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
            <Label
              htmlFor="password"
              className="text-slate-300 text-xs font-medium uppercase tracking-wider"
            >
              Password
            </Label>
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
            onMouseEnter={(e) => {
              if (!loading)
                e.target.style.boxShadow = "0 6px 20px rgba(99,102,241,0.5)";
            }}
            onMouseLeave={(e) => {
              if (!loading)
                e.target.style.boxShadow = "0 4px 16px rgba(99,102,241,0.35)";
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
        <p className="text-center text-slate-600 text-xs mt-6">
          Default: <span className="text-slate-400">admin</span> /{" "}
          <span className="text-slate-400">admin123</span>
        </p>
      </div>
    </div>
  );
}
