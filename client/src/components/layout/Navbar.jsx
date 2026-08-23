"use client";

import { useRouter } from "next/navigation";
import { LogOut, Shield, ChevronDown, UserCheck } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useAuthStore } from "../../store/authStore";
import { api } from "../../lib/api";

export function Navbar() {
  const router = useRouter();
  const { user, setAuth, clearAuth } = useAuthStore();
  const [switching, setSwitching] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      clearAuth();
      document.cookie = "access_token=; path=/; max-age=0; samesite=lax";
      document.cookie = "logged_in=; path=/; max-age=0; samesite=lax";
      toast.success("Logged out successfully 👋");
      router.push("/login");
    }
  };

  const handleQuickRoleSwitch = async (email, password) => {
    setSwitching(true);
    setDropdownOpen(false);
    try {
      const res = await api.post("/auth/login", { email, password });
      const newUser = res.user || res.data?.user;
      const newToken = res.accessToken || res.data?.accessToken;

      if (newUser && newToken) {
        setAuth(newUser, newToken);
        document.cookie = `access_token=${newToken}; path=/; max-age=900; samesite=lax`;
        toast.success(`Switched role to ${newUser.role}`);
        router.refresh();
      }
    } catch (err) {
      toast.error("Quick role switch failed");
      console.error("Quick switch error:", err);
    } finally {
      setSwitching(false);
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case "ADMIN":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "MANAGER":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "EXECUTIVE":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-bold text-slate-800 tracking-tight">
          Portal Overview
        </h2>
        {user?.teamName && (
          <span className="text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 font-medium">
            {user.teamName}
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-3 pl-3 border-l border-slate-200 relative">
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 ${getRoleBadgeClass(
                user.role,
              )}`}
            >
              <Shield className="w-3.5 h-3.5" />
              {user.role}
            </span>

            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold text-slate-800">
                {user.name}
              </div>
              <div className="text-xs text-slate-500">{user.email}</div>
            </div>

            {/* Role Switcher Dropdown Toggle */}
            {/* <button
              onClick={() => setDropdownOpen((prev) => !prev)}
              disabled={switching}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 flex items-center gap-1 text-xs font-medium"
              title="Switch demo account role"
            >
              <UserCheck className="w-4 h-4 text-blue-600" />
              <span className="hidden md:inline">Switch Role</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button> */}

            {dropdownOpen && (
              <div className="absolute right-12 top-12 w-56 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-50 text-xs">
                <div className="font-semibold text-slate-700 px-2 py-1 mb-1 border-b border-slate-100">
                  Switch Active Role (Demo)
                </div>
                <button
                  onClick={() =>
                    handleQuickRoleSwitch("admin@yaxis.com", "Password@123")
                  }
                  className="w-full text-left px-2.5 py-2 hover:bg-purple-50 rounded-lg text-purple-800 flex items-center justify-between transition-colors"
                >
                  <span className="font-semibold">System Admin</span>
                  <span className="text-[10px] text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded">
                    ADMIN
                  </span>
                </button>
                <button
                  onClick={() =>
                    handleQuickRoleSwitch("alice.hyd@yaxis.com", "Password@123")
                  }
                  className="w-full text-left px-2.5 py-2 hover:bg-blue-50 rounded-lg text-blue-800 flex items-center justify-between transition-colors"
                >
                  <span className="font-semibold">Alice Johnson</span>
                  <span className="text-[10px] text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">
                    MANAGER
                  </span>
                </button>
                <button
                  onClick={() =>
                    handleQuickRoleSwitch("bob.hyd1@yaxis.com", "Password@123")
                  }
                  className="w-full text-left px-2.5 py-2 hover:bg-emerald-50 rounded-lg text-emerald-800 flex items-center justify-between transition-colors"
                >
                  <span className="font-semibold">Bob Kumar</span>
                  <span className="text-[10px] text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">
                    EXEC
                  </span>
                </button>
              </div>
            )}

            <button
              onClick={handleLogout}
              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
