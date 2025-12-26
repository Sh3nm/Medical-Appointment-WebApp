"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import {
  clearAuth,
  getStoredRole,
  getRedirectPathByRole,
} from "@/lib/auth";
import {
  CalendarCheck2,
  LogOut,
  X,
  ArrowLeft,
  Clock,
  User,
  Stethoscope,
} from "lucide-react";

type Appointment = {
  id: number;
  date: string;
  status: string;
  doctor: {
    name: string;
    specialization: string;
  };
};

export default function PatientAppointmentsPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  // Redirect if role mismatch
  useEffect(() => {
    const role = getStoredRole();
    if (role && role !== "PATIENT") {
      router.replace(getRedirectPathByRole(role));
    }
  }, [router]);

  const fetchAppointments = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/appointments/me");
      const data = (res.data?.data as Appointment[]) || (res.data as Appointment[]) || [];
      setAppointments(data);
    } catch (err: any) {
      console.error(err);
      const errorMsg = err.response?.data?.message || "Gagal memuat janji temu.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  const canCancel = (appointmentDate: string): boolean => {
    const now = new Date();
    const appointment = new Date(appointmentDate);
    const timeDiff = appointment.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    return hoursDiff > 2;
  };

  const handleCancel = async (appointmentId: number) => {
    if (!confirm("Apakah Anda yakin ingin membatalkan janji temu ini?")) {
      return;
    }

    setCancellingId(appointmentId);
    setError("");
    setSuccess("");

    try {
      await api.patch(`/appointments/${appointmentId}/cancel`);
      setSuccess("Janji temu berhasil dibatalkan.");
      await fetchAppointments();
    } catch (err: any) {
      console.error(err);
      const errorMsg = err.response?.data?.message || "Gagal membatalkan janji temu.";
      setError(errorMsg);
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusUpper = status.toUpperCase();
    if (statusUpper === "PENDING") {
      return (
        <span className="inline-flex items-center rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold px-3 py-1">
          Menunggu
        </span>
      );
    } else if (statusUpper === "FINISHED") {
      return (
        <span className="inline-flex items-center rounded-full bg-green-100 text-green-700 text-xs font-semibold px-3 py-1">
          Selesai
        </span>
      );
    } else if (statusUpper === "CANCELLED") {
      return (
        <span className="inline-flex items-center rounded-full bg-red-100 text-red-700 text-xs font-semibold px-3 py-1">
          Dibatalkan
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-700 text-xs font-semibold px-3 py-1">
        {status}
      </span>
    );
  };

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
              Daftar Janji Temu
            </p>
            <h1 className="text-2xl font-bold text-slate-900">
              Janji Temu Saya
            </h1>
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

      <main className="max-w-6xl mx-auto px-6 py-10">
        {error && (
          <div className="rounded-xl bg-red-50 text-red-700 px-4 py-3 text-sm mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-xl bg-green-50 text-green-700 px-4 py-3 text-sm mb-6">
            {success}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
            <div className="flex items-center gap-2 text-slate-700">
              <CalendarCheck2 size={18} className="text-indigo-600" />
              <span className="font-semibold">Daftar Janji Temu</span>
            </div>
            <button
              onClick={fetchAppointments}
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Muat Ulang
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {loading ? (
              <p className="p-6 text-center text-slate-500">Memuat janji temu...</p>
            ) : appointments.length === 0 ? (
              <p className="p-6 text-center text-slate-500">
                Belum ada janji temu.{" "}
                <Link
                  href="/patient/dashboard"
                  className="text-indigo-600 hover:text-indigo-700 font-semibold"
                >
                  Pesan sekarang
                </Link>
              </p>
            ) : (
              appointments.map((apt) => {
                const isPending = apt.status.toUpperCase() === "PENDING";
                const canCancelAppt = isPending && canCancel(apt.date);

                return (
                  <div
                    key={apt.id}
                    className="px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <Stethoscope className="text-indigo-600" size={18} />
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {apt.doctor?.name || "Dokter"}
                          </p>
                          <p className="text-xs text-slate-600">
                            {apt.doctor?.specialization || "-"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Clock size={16} />
                          <span>
                            {new Date(apt.date).toLocaleString("id-ID", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        {getStatusBadge(apt.status)}
                      </div>
                      {isPending && !canCancelAppt && (
                        <p className="text-xs text-amber-600">
                          ⚠️ Tidak dapat dibatalkan. Kurang dari 2 jam sebelum jadwal.
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {canCancelAppt && (
                        <button
                          onClick={() => handleCancel(apt.id)}
                          disabled={cancellingId === apt.id}
                          className="inline-flex items-center gap-2 rounded-lg border border-red-200 text-red-700 px-4 py-2 text-sm font-semibold hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <X size={16} />
                          {cancellingId === apt.id ? "Membatalkan..." : "Batalkan"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

