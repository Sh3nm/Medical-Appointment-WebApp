"use client";

import { clearAuth, getRedirectPathByRole, getStoredRole } from "@/lib/auth";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, ShieldCheck } from "lucide-react";

export default function AdminDashboard() {
  const router = useRouter();

  useEffect(() => {
    const role = getStoredRole();
    if (role && role !== "ADMIN") {
      router.replace(getRedirectPathByRole(role));
    }
  }, [router]);

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-md border border-slate-200 p-8 space-y-4 text-center">
        <div className="flex items-center justify-center gap-2 text-indigo-600">
          <ShieldCheck />
          <span className="font-semibold">Admin Dashboard</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">
          Area Admin (Placeholder)
        </h1>
        <p className="text-slate-600">
          Peran ADMIN opsional untuk V0. Tambahkan modul admin di iterasi
          berikutnya.
        </p>
        <div className="flex justify-center">
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-slate-700 hover:bg-slate-100"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

