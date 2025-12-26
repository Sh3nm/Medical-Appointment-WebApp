"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { clearAuth, getStoredRole, getRedirectPathByRole } from "@/lib/auth";
import { LogOut, User, Mail, Calendar, Save, ArrowLeft } from "lucide-react";

type Profile = {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

export default function PatientProfile() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state
  const [name, setName] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Redirect if role mismatch
  useEffect(() => {
    const role = getStoredRole();
    if (role && role !== "PATIENT") {
      router.replace(getRedirectPathByRole(role));
    }
  }, [router]);

  const fetchProfile = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/users/me");
      const data = res.data?.data || res.data;
      setProfile(data);
      setName(data.name || "");
    } catch (err: any) {
      console.error(err);
      const errorMsg = err.response?.data?.message || "Gagal memuat profile.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  const handleDelete = async () => {
    if (!confirm("Hapus akun? Tindakan ini tidak bisa dibatalkan.")) return;
    setDeleting(true);
    setError("");
    setSuccess("");
    try {
      await api.delete("/users/me");
      clearAuth();
      router.push("/login");
    } catch (err: any) {
      console.error(err);
      const errorMsg = err.response?.data?.message || "Gagal menghapus akun.";
      setError(errorMsg);
    } finally {
      setDeleting(false);
    }
  };

  const handleUpdate = async () => {
    setError("");
    setSuccess("");
    setUpdating(true);

    // Validation
    if (newPassword && newPassword.length < 8) {
      setError("Password baru minimal 8 karakter.");
      setUpdating(false);
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setError("Password baru dan konfirmasi password tidak cocok.");
      setUpdating(false);
      return;
    }

    if (newPassword && !oldPassword) {
      setError("Password lama wajib diisi untuk mengubah password.");
      setUpdating(false);
      return;
    }

    try {
      const updateData: any = {};
      if (name && name !== profile?.name) {
        updateData.name = name;
      }
      if (newPassword) {
        updateData.oldPassword = oldPassword;
        updateData.newPassword = newPassword;
      }

      if (Object.keys(updateData).length === 0) {
        setError("Tidak ada perubahan yang dilakukan.");
        setUpdating(false);
        return;
      }

      const res = await api.patch("/users/me", updateData);
      const updatedData = res.data?.data || res.data;
      setProfile(updatedData);
      setName(updatedData.name || "");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess("Profile berhasil diperbarui!");
    } catch (err: any) {
      console.error(err);
      const errorMsg = err.response?.data?.message || "Gagal memperbarui profile.";
      setError(errorMsg);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-slate-500">Memuat profile...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">Gagal memuat profile.</div>
          <Link
            href="/patient/dashboard"
            className="text-indigo-600 hover:text-indigo-700"
          >
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between px-6 py-4 bg-white shadow-sm border-b border-slate-100">
        <div className="flex items-center gap-4">
          <Link
            href="/patient/dashboard"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft size={18} />
            Kembali
          </Link>
          <div>
            <p className="text-xs font-semibold text-indigo-600 uppercase">
              Patient Profile
            </p>
            <h1 className="text-2xl font-bold text-slate-900">Profile Saya</h1>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-slate-700 hover:bg-slate-100"
        >
          <LogOut size={18} />
          Logout
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-6">
          {/* Profile Info Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
              <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
                <User className="text-indigo-600" size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{profile.name}</h2>
                <p className="text-sm text-slate-600">Pasien</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
                <Mail className="text-slate-400 mt-1" size={20} />
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Email</p>
                  <p className="text-slate-900 font-medium">{profile.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
                <Calendar className="text-slate-400 mt-1" size={20} />
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">
                    Bergabung
                  </p>
                  <p className="text-slate-900 font-medium">
                    {new Date(profile.createdAt).toLocaleDateString("id-ID", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Update Form Section */}
          <div className="pt-6 border-t border-slate-200 space-y-6">
            <h3 className="text-xl font-bold text-slate-900">Edit Profile</h3>

            {error && (
              <div className="rounded-xl bg-red-50 text-red-700 px-4 py-3 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-xl bg-green-50 text-green-700 px-4 py-3 text-sm">
                {success}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Masukkan nama lengkap"
                />
              </div>

              <div className="pt-4 border-t border-slate-200">
                <h4 className="text-sm font-semibold text-slate-900 mb-4">
                  Ubah Password
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Password Lama
                    </label>
                    <input
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Masukkan password lama"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Password Baru
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Minimal 8 karakter"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Konfirmasi Password Baru
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Ulangi password baru"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Link
                href="/patient/dashboard"
                className="rounded-lg border border-slate-200 px-6 py-3 text-slate-700 hover:bg-slate-100 font-medium"
              >
                Batal
              </Link>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 rounded-lg border border-red-200 text-red-700 px-6 py-3 font-semibold hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {deleting ? "Menghapus..." : "Hapus Akun"}
              </button>
              <button
                onClick={handleUpdate}
                disabled={updating}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 text-white px-6 py-3 font-semibold hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Save size={18} />
                {updating ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

