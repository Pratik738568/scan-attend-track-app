
import React, { useState } from "react";
import { Login, QrCode, View } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

// Simple in-memory demo
const DEMO_USERS = [
  { role: "hod", email: "hod@demo.com", password: "pass123", name: "HOD Admin" },
  { role: "faculty", email: "faculty@demo.com", password: "pass123", name: "Faculty John" },
  { role: "student", email: "student@demo.com", password: "pass123", name: "Student Sam", roll: "A100", prn: "1234567890123" },
];

const ROLES = [
  { label: "Student", value: "student" },
  { label: "Faculty", value: "faculty" },
  { label: "HOD", value: "hod" }
];

type Role = "student" | "faculty" | "hod";
type User = {
  name: string;
  email: string;
  password: string;
  role: Role;
  roll?: string;
  prn?: string;
};

const initialSignup = { name: "", email: "", password: "", roll: "", prn: "" };

export default function Auth() {
  const [mode, setMode] = useState<"login"|"signup">("login");
  const [role, setRole] = useState<Role>("student");
  const [data, setData] = useState(initialSignup);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function handleDemoAuthLogin() {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      localStorage.setItem("qr_user", JSON.stringify({
        role,
        email: data.email,
        name: data.name || data.email.split("@")[0]
      }));
      if (role === "student") navigate("/student");
      else if (role === "faculty") navigate("/faculty");
      else navigate("/hod");
    }, 600);
  }

  function handleSwitchMode() {
    setMode((m) => m === "login" ? "signup" : "login");
    setError("");
    setData(initialSignup);
  }

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    setData(d => ({
      ...d,
      [e.target.name]: e.target.value,
    }));
  }

  function validateSignup(): boolean {
    if (!data.name || !data.email || !data.password) return false;
    if (role === "student" && (!data.roll || !data.prn || data.prn.length !== 13)) return false;
    return true;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    setTimeout(() => {
      if (mode === "login") {
        // Demo logic; replace with backend auth
        const found = DEMO_USERS.find(u =>
          u.role === role &&
          u.email === data.email &&
          u.password === data.password
        );
        if (!found) {
          setError("Invalid credentials. Try the demo accounts or signup.");
          setLoading(false);
          return;
        }
        localStorage.setItem("qr_user", JSON.stringify(found));
        setLoading(false);
        if (role === "student") navigate("/student");
        else if (role === "faculty") navigate("/faculty");
        else navigate("/hod");
      } else {
        // Demo signup
        if (!validateSignup()) {
          setError("Please fill all fields correctly.");
          setLoading(false);
          return;
        }
        localStorage.setItem("qr_user", JSON.stringify({ ...data, role }));
        setLoading(false);
        if (role === "student") navigate("/student");
        else if (role === "faculty") navigate("/faculty");
        else navigate("/hod");
      }
    }, 600);
  }

  return (
    <div className="min-h-screen bg-gradient-to-tr from-indigo-50 to-fuchsia-100 flex flex-col items-center justify-start pt-6 px-3 animate-fade-in">
      <div className="bg-white shadow-2xl rounded-2xl max-w-md w-full py-8 px-8 mb-4 border-t-8 border-indigo-400 relative animate-scale-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-indigo-700 font-bold text-2xl">{mode === "login" ? "Sign In" : "Sign Up"}</h2>
          <span className="text-sm font-medium text-indigo-400 px-3 py-1 rounded-full bg-indigo-50">{role.charAt(0).toUpperCase() + role.slice(1)} Mode</span>
        </div>
        <div className="flex gap-2 mb-5 justify-center">
          {ROLES.map(r => (
            <button
              key={r.value}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-semibold focus:outline-none transition-all border",
                role === r.value
                  ? "bg-indigo-600 text-white border-indigo-500 shadow-md"
                  : "bg-gray-100 border-gray-200 text-indigo-600 hover:bg-indigo-200"
              )}
              onClick={() => { setRole(r.value as Role); setError(""); }}
              disabled={loading}
            >
              {r.label}
            </button>
          ))}
        </div>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          {mode === "signup" && (
            <>
              <input name="name"
                className="border px-3 py-2 rounded-lg"
                placeholder="Full Name"
                value={data.name}
                onChange={handleInput}
                disabled={loading}
                required
              />
              {role === "student" && (
                <>
                  <input name="roll" className="border px-3 py-2 rounded-lg"
                    placeholder="Roll Number"
                    value={data.roll}
                    onChange={handleInput}
                    disabled={loading}
                    required
                  />
                  <input name="prn" maxLength={13} minLength={13} className="border px-3 py-2 rounded-lg"
                    placeholder="13-digit PRN Number"
                    value={data.prn}
                    onChange={handleInput}
                    disabled={loading}
                    required
                  />
                </>
              )}
            </>
          )}
          <input type="email" name="email" className="border px-3 py-2 rounded-lg"
            placeholder="Email"
            value={data.email}
            onChange={handleInput}
            disabled={loading}
            autoComplete={mode === "login" ? "username" : undefined}
            required
          />
          <input type="password" name="password" className="border px-3 py-2 rounded-lg"
            placeholder="Password"
            value={data.password}
            onChange={handleInput}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            disabled={loading}
            required
          />
          {error && <div className="text-rose-600 font-medium text-sm bg-rose-100 px-3 py-1 rounded">{error}</div>}
          <button
            type="submit"
            className={cn("w-full mt-1 px-4 py-2 rounded-lg font-semibold transition-all",
              loading
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700 text-white shadow")}
            disabled={loading}>
            {loading ? (mode === "login" ? "Signing In..." : "Signing Up...") : (mode === "login" ? "Sign In" : "Sign Up")}
          </button>
          <button
            type="button"
            className="block underline text-xs text-gray-500 cursor-pointer mx-auto"
            onClick={handleSwitchMode}
            disabled={loading}
          >
            {mode === "login" ? "Don't have an account? Sign Up" : "Already registered? Sign In"}
          </button>
        </form>
        <div className="mt-4 flex flex-col items-center gap-2">
          <span className="text-sm text-gray-400">Demo:</span>
          <button
            className="w-full flex items-center justify-center py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition mt-1 shadow"
            onClick={handleDemoAuthLogin}
            disabled={loading}
          >
            <Login size={18} className="mr-2" /> Quick Demo Login ({role.charAt(0).toUpperCase()+role.slice(1)})
          </button>
        </div>
      </div>
      <a href="/" className="mt-1 text-indigo-500 text-sm underline hover:text-indigo-700 transition">← Back to Home</a>
    </div>
  );
}
