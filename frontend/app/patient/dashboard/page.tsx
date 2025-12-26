"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { clearAuth, getStoredRole, getRedirectPathByRole, UserRole } from "@/lib/auth";
import { CalendarClock, LogOut, Search, Stethoscope, User } from "lucide-react";
import ModalDialog from "@/components/ui/modal-dialog";

type Doctor = {
  id: string;
  name: string;
  specialization: string;
  availableText?: string;
};

type AppointmentPayload = {
  doctorId: string;
  scheduledAt: string;
  notes?: string;
};

export default function PatientDashboard() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [scheduledAt, setScheduledAt] = useState("");
  const [notes, setNotes] = useState("");
  const [confirmation, setConfirmation] = useState<AppointmentPayload | null>(
    null,
  );
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Redirect if role mismatch.
  useEffect(() => {
    const role = getStoredRole();
    if (role && role !== "PATIENT") {
      router.replace(getRedirectPathByRole(role));
    }
  }, [router]);

  const fetchDoctors = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/doctors");
      let data = (res.data?.data as Doctor[]) || (res.data as Doctor[]) || [];
      
      // Filter berdasarkan search (nama atau specialization)
      if (search) {
        const searchLower = search.toLowerCase();
        data = data.filter(
          (d) =>
            d.name.toLowerCase().includes(searchLower) ||
            d.specialization.toLowerCase().includes(searchLower)
        );
      }
      
      // Filter berdasarkan specialization dropdown
      if (specialization) {
        data = data.filter((d) => d.specialization === specialization);
      }

      setDoctors(
        data.map((d) => ({
          id: (d as Doctor).id,
          name: (d as Doctor).name,
          specialization: (d as Doctor).specialization,
          availableText:
            (d as Doctor).availableText || "Available Hari Ini",
        })),
      );
    } catch (err) {
      console.error(err);
      setError("Gagal memuat dokter. Menampilkan contoh data.");
      setDoctors([
        {
          id: "sample-1",
          name: "Dr. Siti Rahma",
          specialization: "Dokter Umum",
          availableText: "Available Hari Ini",
        },
        {
          id: "sample-2",
          name: "Dr. Andi Kardi",
          specialization: "Kardiologi",
          availableText: "Available Besok",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto search ketika search atau specialization berubah
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchDoctors();
    }, 300); // Debounce 300ms

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, specialization]);

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  const openBooking = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setScheduledAt("");
    setNotes("");
    setConfirmation(null);
  };

  const handleBooking = async () => {
    if (!selectedDoctor || !scheduledAt) return;
    setBookingLoading(true);
    setError("");
    try {
      await api.post("/appointments", {
        doctorId: parseInt(selectedDoctor.id),
        appointmentDate: scheduledAt,
      });
      setConfirmation({
        doctorId: selectedDoctor.id,
        scheduledAt,
        notes: notes || undefined,
      });
      setShowSuccessModal(true);
      setSelectedDoctor(null);
      // Refresh appointments if needed
    } catch (err: any) {
      console.error(err);
      const errorMsg = err.response?.data?.message || "Gagal membuat janji. Coba lagi.";
      setError(errorMsg);
    } finally {
      setBookingLoading(false);
    }
  };

  const renderDoctors = useMemo(
    () =>
      doctors.map((doctor) => (
        <div
          key={doctor.id}
          className="rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-indigo-600 font-semibold">
              <Stethoscope size={18} />
              <span>{doctor.specialization}</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900">{doctor.name}</h3>
            <p className="text-sm text-green-600">{doctor.availableText}</p>
          </div>
          <button
            onClick={() => openBooking(doctor)}
            className="mt-6 w-full rounded-xl bg-indigo-600 text-white py-3 font-semibold hover:bg-indigo-700 transition-colors"
          >
            Pesan Sekarang
          </button>
        </div>
      )),
    [doctors],
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between px-6 py-4 bg-white shadow-sm border-b border-slate-100">
        <div>
          <p className="text-xs font-semibold text-indigo-600 uppercase">
            Patient Dashboard
          </p>
          <h1 className="text-2xl font-bold text-slate-900">
            Cari & Booking Dokter
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/patient/appointments"
            className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 text-indigo-700 px-4 py-2 hover:bg-indigo-50"
          >
            Janji Temu Saya
          </Link>
          <Link
            href="/patient/records"
            className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 text-indigo-700 px-4 py-2 hover:bg-indigo-50"
          >
            Lihat Rekam Medis
          </Link>
          <Link
            href="/patient/profile"
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

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 bg-slate-50">
              <Search className="text-slate-400" size={18} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari berdasarkan nama dokter atau spesialisasi (contoh: Dokter Umum, Kardiologi)"
                className="w-full bg-transparent outline-none text-slate-700"
              />
            </div>
            <select
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              className="rounded-xl border border-slate-200 px-4 py-3 bg-white text-slate-700"
            >
              <option value="">Semua Spesialisasi</option>
              <option value="Dokter Umum">Dokter Umum</option>
              <option value="Kardiologi">Kardiologi</option>
              <option value="Pediatri">Pediatri</option>
            </select>
            <button
              onClick={fetchDoctors}
              className="rounded-xl bg-indigo-600 text-white px-6 py-3 font-semibold hover:bg-indigo-700 transition-colors"
            >
              Cari
            </button>
          </div>
          {error && (
            <div className="rounded-xl bg-red-50 text-red-700 px-4 py-3 text-sm">
              {error}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full text-center text-slate-500">
              Memuat dokter...
            </div>
          ) : doctors.length === 0 ? (
            <div className="col-span-full text-center text-slate-500">
              Tidak ada dokter ditemukan.
            </div>
          ) : (
            renderDoctors
          )}
        </div>

        {selectedDoctor && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-4 z-50">
            <div className="w-full max-w-xl bg-white rounded-2xl p-6 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-indigo-600 uppercase">
                    Booking Janji
                  </p>
                  <h3 className="text-xl font-bold text-slate-900">
                    {selectedDoctor.name}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {selectedDoctor.specialization}
                  </p>
                </div>
                <CalendarClock className="text-indigo-600" />
              </div>

              {confirmation ? (
                <div className="space-y-3 rounded-xl border border-green-200 bg-green-50 p-4">
                  <p className="text-green-700 font-semibold">
                    Janji Temu Berhasil Dibuat!
                  </p>
                  <p className="text-sm text-green-800">
                    Dokter: {selectedDoctor.name} ({selectedDoctor.specialization})
                  </p>
                  <p className="text-sm text-green-800">
                    Waktu: {new Date(confirmation.scheduledAt).toLocaleString()}
                  </p>
                  {confirmation.notes && (
                    <p className="text-sm text-green-800">
                      Catatan: {confirmation.notes}
                    </p>
                  )}
                  <div className="flex justify-end">
                    <button
                      onClick={() => setSelectedDoctor(null)}
                      className="rounded-lg bg-indigo-600 text-white px-4 py-2 font-semibold hover:bg-indigo-700"
                    >
                      Tutup
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      Pilih Tanggal & Waktu
                    </label>
                    <input
                      type="datetime-local"
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      Catatan (opsional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      rows={3}
                      placeholder="Keluhan singkat atau preferensi waktu"
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setSelectedDoctor(null)}
                      className="rounded-lg border border-slate-200 px-4 py-2 text-slate-700 hover:bg-slate-100"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleBooking}
                      disabled={bookingLoading || !scheduledAt}
                      className="rounded-lg bg-indigo-600 text-white px-5 py-2 font-semibold hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {bookingLoading ? "Memproses..." : "Konfirmasi"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Success Modal */}
      <ModalDialog
        open={showSuccessModal}
        onOpenChange={setShowSuccessModal}
        title="Janji Temu Berhasil Dibuat!"
        description={`Janji temu Anda dengan dokter telah berhasil dibuat. Silakan cek dashboard untuk melihat detail janji temu.`}
        onDashboardClick={() => {
          setShowSuccessModal(false);
          fetchDoctors();
        }}
      />
    </div>
  );
}

