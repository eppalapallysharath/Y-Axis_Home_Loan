"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Shield,
  KeyRound,
  Mail,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../../lib/api";
import { useAuth } from "../../redux/hooks";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const reason = searchParams.get("reason");
  const redirectFrom = searchParams.get("from");

  useEffect(() => {
    if (reason === "session_expired") {
      const msg = "Your session has expired. Please sign in again.";
      setError(msg);
      toast.error(msg);
    }
  }, [reason]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/login", { email, password });
      const user = res.user || res.data?.user;
      const accessToken = res.accessToken || res.data?.accessToken;

      if (user && accessToken) {
        setAuth(user, accessToken);
        document.cookie = `access_token=${accessToken}; path=/; max-age=900; samesite=lax`;
        document.cookie = `logged_in=true; path=/; max-age=604800; samesite=lax`;
        toast.success(`Welcome back, ${user.name}! 👋`);
        const destination = redirectFrom || "/dashboard";
        router.push(destination);
      } else {
        throw new Error("Invalid login response");
      }
    } catch (err) {
      let errMsg =
        err.message || "Invalid email or password. Please try again.";
      if (err.data?.error === "AccountDeactivated") {
        errMsg =
          "Your account has been deactivated. Please contact your administrator.";
      }
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handlePresetLogin = (presetEmail, presetPass) => {
    setEmail(presetEmail);
    setPassword(presetPass);
    setError("");
  };

  return (
    <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 z-10">
      {/* Left Info Panel */}
      <div className="md:col-span-5 bg-gradient-to-br from-[#1A2B4C] via-[#16243F] to-[#2A3D6B] p-8 text-white flex flex-col justify-between border-b md:border-b-0 md:border-r border-[#16243F]">
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#C5A059] flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-yellow-900/30">
              Y
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-wide text-white">
                Y-Axis Home Loans
              </h1>
              <p className="text-xs text-[#D4B57A] font-medium">
                Enterprise Processing Portal
              </p>
            </div>
          </div>

          <h2 className="text-xl font-bold mb-3 text-slate-100 leading-tight">
            Internal Operations Portal
          </h2>
          <p className="text-xs text-slate-300 mb-6 leading-relaxed">
            Streamlined loan origination, customer verification, and core banking workflow management.
          </p>

          {/* Clean Feature Bullet Points */}
          <div className="space-y-3 text-xs text-slate-300">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#C5A059] flex-shrink-0" />
              <span>End-to-end loan application processing</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#C5A059] flex-shrink-0" />
              <span>Role-governed verification & approval workflows</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#C5A059] flex-shrink-0" />
              <span>Automated Core Banking System (CBS) integration</span>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-slate-700/80 text-[11px] text-slate-400">
          Authorized Y-Axis Employee Access Only
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="md:col-span-7 p-8 flex flex-col justify-center">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Login to your account
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Enter your credentials to access your assigned role workspace
          </p>
        </div>

        {/* Demo Role Presets */}
        {/* <div className="mb-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="text-xs font-semibold text-slate-700 mb-2.5 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-blue-600" />
            <span>Quick Demo Role Presets (Click to Fill)</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handlePresetLogin('admin@yaxis.com', 'Password@123')}
              className="px-2.5 py-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-medium transition-colors text-center"
            >
              <span className="block font-semibold">Admin</span>
              <span className="text-[10px] opacity-75">Full System</span>
            </button>

            <button
              type="button"
              onClick={() => handlePresetLogin('alice.hyd@yaxis.com', 'Password@123')}
              className="px-2.5 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-medium transition-colors text-center"
            >
              <span className="block font-semibold">Manager</span>
              <span className="text-[10px] opacity-75">Hyd Branch</span>
            </button>

            <button
              type="button"
              onClick={() => handlePresetLogin('bob.hyd1@yaxis.com', 'Password@123')}
              className="px-2.5 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-medium transition-colors text-center"
            >
              <span className="block font-semibold">Executive</span>
              <span className="text-[10px] opacity-75">Assigned Apps</span>
            </button>
          </div>
        </div> */}

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                id="login-email"
                type="email"
                required
                suppressHydrationWarning
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@yaxis.com"
                className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A059] focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                required
                suppressHydrationWarning
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-10 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A059] focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                title={showPassword ? "Hide password" : "Show password"}
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
            id="login-submit"
            type="submit"
            disabled={loading || !email || !password}
            className="w-full py-2.5 bg-[#1A2B4C] hover:bg-[#16243F] text-white font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Signing in...</span>
              </span>
            ) : (
              <>
                <span>Login</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#1A2B4C] flex items-center justify-center p-4 relative">
      {/* Dynamic Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-[#C5A059] blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-[#2A3D6B] blur-3xl"></div>
      </div>

      <Suspense
        fallback={<div className="text-white text-sm">Loading auth...</div>}
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
