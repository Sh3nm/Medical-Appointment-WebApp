"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { clearAuth, getStoredRole, getRedirectPathByRole } from "@/lib/auth";
import { CalendarRange, LogOut, UserRoundSearch, User, CheckCircle } from "lucide-react";

type Appointment = {
  id: string;
  patientName: string;
  scheduledAt: string;
  status: string;
  notes?: string;
  reason?: string;
};

export default function DoctorDashboard() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [finishingId, setFinishingId] = useState<string | null>(null);

  useEffect(() => {
    const role = getStoredRole();
    if (role && role !== "DOCTOR") {
      router.replace(getRedirectPathByRole(role));
    }
  }, [router]);

  const fetchAppointments = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/appointments/doctor/me");
      const data =
        (res.data?.data as Appointment[]) ||
        (res.data as Appointment[]) ||
        [];
      setAppointments(
        data.map((a: any) => ({
          id: a.id?.toString() || "",
          patientName: a.user?.name || a.patientName || "Pasien",
          scheduledAt: a.date || a.scheduledAt || new Date().toISOString(),
          status: a.status || "PENDING",
          notes: a.notes,
          reason: a.reason,
        })),
      );
    } catch (err: any) {
      console.error(err);
      const errorMsg = err.response?.data?.message || "Gagal memuat janji.";
      setError(errorMsg);
      // Don't show sample data on 401 - let interceptor handle redirect
      if (err.response?.status !== 401) {
        setAppointments([
          {
            id: "sample-apt-1",
            patientName: "Budi Santoso",
            scheduledAt: new Date().toISOString(),
            status: "PENDING",
            reason: "Kontrol rutin",
          },
        ]);
      }
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

  const handleFinishAppointment = async (appointmentId: string) => {
    if (!confirm("Apakah Anda yakin ingin menandai janji temu ini sebagai selesai?")) {
      return;
    }

    setFinishingId(appointmentId);
    setError("");
    setSuccess("");

    try {
      await api.patch(`/appointments/${appointmentId}/status`, {
        status: "FINISHED",
      });
      setSuccess("Janji temu berhasil ditandai sebagai selesai.");
      await fetchAppointments();
      setSelected(null);
    } catch (err: any) {
      console.error(err);
      const errorMsg = err.response?.data?.message || "Gagal mengubah status janji temu.";
      setError(errorMsg);
    } finally {
      setFinishingId(null);
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
        <div>
          <p className="text-xs font-semibold text-indigo-600 uppercase">
            Doctor Dashboard
          </p>
          <h1 className="text-2xl font-bold text-slate-900">
            Jadwal Janji Pasien
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/doctor/profile"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 text-slate-700 px-4 py-2 hover:bg-slate-100"
          >
            <User size={18} />
            Profile
          </Link>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-slate-700 hover:bg-slate-100"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-6">
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
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
            <div className="flex items-center gap-2 text-slate-700">
              <CalendarRange size={18} className="text-indigo-600" />
              <span className="font-semibold">Daftar Janji</span>
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
              <p className="p-6 text-center text-slate-500">Memuat janji...</p>
            ) : appointments.length === 0 ? (
              <p className="p-6 text-center text-slate-500">
                Belum ada janji.
              </p>
            ) : (
              appointments.map((apt) => {
                const isPending = apt.status.toUpperCase() === "PENDING";
                return (
                  <div
                    key={apt.id}
                    className="px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                  >
                    <div className="space-y-1 flex-1">
                      <p className="text-sm font-semibold text-slate-900">
                        {apt.patientName}
                      </p>
                      <p className="text-sm text-slate-600">
                        {new Date(apt.scheduledAt).toLocaleString("id-ID", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      {getStatusBadge(apt.status)}
                    </div>
                    <div className="flex items-center gap-2">
                      {isPending && (
                        <button
                          onClick={() => handleFinishAppointment(apt.id)}
                          disabled={finishingId === apt.id}
                          className="inline-flex items-center gap-2 rounded-lg bg-green-600 text-white px-4 py-2 text-sm font-semibold hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <CheckCircle size={16} />
                          {finishingId === apt.id ? "Memproses..." : "Selesai"}
                        </button>
                      )}
                      <button
                        onClick={() => setSelected(apt)}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-slate-700 hover:bg-slate-100"
                      >
                        <UserRoundSearch size={16} />
                        Lihat Detail
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>

      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-4 z-50">
          <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-indigo-600 uppercase">
                  Detail Janji
                </p>
                <h3 className="text-xl font-bold text-slate-900">
                  {selected.patientName}
                </h3>
                <p className="text-sm text-slate-600">
                  {new Date(selected.scheduledAt).toLocaleString()}
                </p>
              </div>
              <CalendarRange className="text-indigo-600" />
            </div>

            {selected.reason && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500">Alasan</p>
                <p className="text-sm text-slate-800">{selected.reason}</p>
              </div>
            )}

            {selected.notes && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500">Catatan</p>
                <p className="text-sm text-slate-800">{selected.notes}</p>
              </div>
            )}

            <div className="pt-2">
              {getStatusBadge(selected.status)}
            </div>

            <div className="flex justify-end gap-3">
              {selected.status.toUpperCase() === "PENDING" && (
                <button
                  onClick={() => {
                    handleFinishAppointment(selected.id);
                  }}
                  disabled={finishingId === selected.id}
                  className="inline-flex items-center gap-2 rounded-lg bg-green-600 text-white px-4 py-2 font-semibold hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <CheckCircle size={16} />
                  {finishingId === selected.id ? "Memproses..." : "Tandai Selesai"}
                </button>
              )}
              <button
                onClick={() => setSelected(null)}
                className="rounded-lg bg-indigo-600 text-white px-4 py-2 font-semibold hover:bg-indigo-700"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

