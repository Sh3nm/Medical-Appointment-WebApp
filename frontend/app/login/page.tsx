"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { getRedirectPathByRole, setAuth, UserRole } from "@/lib/auth";
import { Eye, EyeOff, LogIn } from "lucide-react";

type LoginResponse = {
  access_token?: string;
  token?: string;
  accessToken?: string;
  role?: UserRole;
  user?: { 
    role?: UserRole;
    id?: number;
    email?: string;
    name?: string;
  };
  data?: {
    token?: string;
    accessToken?: string;
    role?: UserRole;
    user?: { role?: UserRole };
  };
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const extractAuth = (payload: LoginResponse) => {
    const token =
      payload.access_token ||
      payload.token ||
      payload.accessToken ||
      payload.data?.token ||
      payload.data?.accessToken ||
      "";
    const role: UserRole =
      payload.role ||
      payload.user?.role ||
      payload.data?.role ||
      (payload.data?.user?.role as UserRole) ||
      "";
    return { token, role };
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post<LoginResponse>("/auth/login", {
        email,
        password,
      });
      const { token, role } = extractAuth(res.data);

      if (!role) {
        setError("Role tidak ditemukan di respons. Hubungi admin.");
        return;
      }

      if (!token) {
        // Still allow role-based navigation when backend uses cookie sessions.
        setAuth("", role);
      } else {
        setAuth(token, role);
      }

      const destination = getRedirectPathByRole(role);
      router.push(destination);
    } catch (err: unknown) {
      setError("Login gagal. Periksa email / password Anda.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
        <div className="hidden md:block bg-indigo-600 text-white p-10 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-700 opacity-90" />
          <div className="relative space-y-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-indigo-50">
              Welcome Back
            </p>
            <h2 className="text-3xl font-bold leading-tight">
              Masuk dan lanjutkan pencarian atau jadwal Anda.
            </h2>
            <p className="text-indigo-100">
              Sistem akan otomatis mengarahkan Anda ke dashboard sesuai peran
              (Pasien atau Dokter) setelah login.
            </p>
            <ul className="space-y-2 text-indigo-50 text-sm">
              <li>• Login aman</li>
              <li>• Pengalihan peran otomatis</li>
              <li>• Dukungan booking & jadwal</li>
            </ul>
          </div>
        </div>

        <div className="p-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">
                Autentikasi
              </p>
              <h1 className="text-3xl font-bold text-slate-900">
                Masuk ke Akun
              </h1>
              <p className="text-slate-600 mt-2">
                Gunakan email dan kata sandi yang terdaftar.
              </p>
            </div>
            <LogIn className="text-indigo-600" />
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@contoh.com"
                required
                className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Kata Sandi
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 text-red-700 px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-indigo-600 text-white py-3 font-semibold hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>

          <div className="mt-6 text-sm text-slate-600">
            Belum punya akun?{" "}
            <button
              type="button"
              onClick={() => router.push("/auth/register")}
              className="text-indigo-600 font-semibold hover:underline"
            >
              Daftar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

