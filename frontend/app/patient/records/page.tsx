"use client";

import { useEffect, useMemo, useState } from "react";
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
  FileUp,
  LogOut,
  NotebookPen,
  X,
  Eye,
  FileText,
} from "lucide-react";
import ModalDialog from "@/components/ui/modal-dialog";

type Appointment = {
  id: string;
  date: string;
  status: string;
  doctorName: string;
  doctorSpecialization?: string;
};

type MedicalRecord = {
  id: number;
  fileName: string;
  mimeType: string;
  noteContent?: string;
  uploadedAt: string;
  updatedAt: string;
};

export default function PatientRecordsPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [uploadedIds, setUploadedIds] = useState<string[]>([]);
  const [uploadedRecords, setUploadedRecords] = useState<Record<string, MedicalRecord>>({});
  const [viewingRecord, setViewingRecord] = useState<MedicalRecord | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [loadingRecord, setLoadingRecord] = useState(false);

  // Redirect if role mismatch.
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
      const data = (res.data?.data as any[]) || (res.data as any[]) || [];
      const mapped = data.map((apt) => ({
        id: apt.id?.toString() || "",
        date: apt.date || apt.scheduledAt || "",
        status: (apt.status || "").toString(),
        doctorName:
          apt.doctor?.name || apt.doctorName || "Dokter belum ditentukan",
        doctorSpecialization: apt.doctor?.specialization,
      })) as Appointment[];

      setAppointments(mapped);

      // After fetching appointments, fetch records for finished appointments
      await fetchAllRecords(mapped.filter(apt => apt.status?.toUpperCase?.() === "FINISHED"));
    } catch (err: any) {
      console.error(err);
      const errorMsg =
        err.response?.data?.message || "Gagal memuat janji temu.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllRecords = async (finishedApts: Appointment[]) => {
    // Fetch records for all finished appointments
    const recordsMap: Record<string, MedicalRecord> = {};
    
    for (const apt of finishedApts) {
      try {
        // Use the correct endpoint: /records/appointment/:appointmentId
        const res = await api.get(`/records/appointment/${apt.id}`);
        const recordData = res.data?.data || res.data;
        if (recordData) {
          recordsMap[apt.id] = recordData;
          setUploadedIds((prev) => Array.from(new Set([...prev, apt.id])));
        }
      } catch (err: any) {
        // If 404, record doesn't exist yet - that's okay
        if (err.response?.status !== 404) {
          console.error(`Failed to fetch record for appointment ${apt.id}:`, err);
        }
      }
    }
    
    setUploadedRecords(recordsMap);
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const finishedAppointments = useMemo(
    () =>
      appointments.filter(
        (apt) => apt.status?.toUpperCase?.() === "FINISHED",
      ),
    [appointments],
  );

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  const resetForm = () => {
    setFile(null);
    setNotes("");
    setSuccessMessage("");
  };

  const startUpload = (apt: Appointment) => {
    setSelected(apt);
    resetForm();
  };

  const fetchRecordByAppointmentId = async (appointmentId: string) => {
    // Try to get record from already loaded data first
    if (uploadedRecords[appointmentId]) {
      setViewingRecord(uploadedRecords[appointmentId]);
      setShowViewModal(true);
      return;
    }

    // If not found, try to fetch from backend
    setLoadingRecord(true);
    setError("");
    try {
      // Use the correct endpoint: /records/appointment/:appointmentId
      const res = await api.get(`/records/appointment/${appointmentId}`);
      const recordData = res.data?.data || res.data;
      
      if (recordData) {
        setUploadedRecords((prev) => ({
          ...prev,
          [appointmentId]: recordData,
        }));
        setViewingRecord(recordData);
        setShowViewModal(true);
      }
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 404) {
        setError("Rekam medis belum ditemukan. Silakan unggah terlebih dahulu.");
      } else {
        setError("Gagal memuat rekam medis. Coba lagi.");
      }
    } finally {
      setLoadingRecord(false);
    }
  };

  const handleUpload = async () => {
    if (!selected || !file) {
      setError("Pilih janji temu dan unggah file rekam medis.");
      return;
    }

    setUploading(true);
    setError("");
    setSuccessMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("appointmentId", selected.id);
      if (notes) {
        formData.append("notes", notes);
      }

      const res = await api.post("/records", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const recordData = res.data?.data || res.data;
      setSuccessMessage("Rekam medis berhasil diunggah.");
      setUploadedIds((prev) => Array.from(new Set([...prev, selected.id])));
      setUploadedRecords((prev) => ({
        ...prev,
        [selected.id]: recordData,
      }));
      setSelected(null);
      resetForm();
      setShowSuccessModal(true);
    } catch (err: any) {
      console.error(err);
      const message =
        err.response?.data?.message ||
        "Gagal mengunggah rekam medis. Coba lagi.";
      setError(message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between px-6 py-4 bg-white shadow-sm border-b border-slate-100">
        <div>
          <p className="text-xs font-semibold text-indigo-600 uppercase">
            Rekam Medis
          </p>
          <h1 className="text-2xl font-bold text-slate-900">
            Unggah Rekam Medis Setelah Janji Selesai
          </h1>
          <p className="text-sm text-slate-600">
            Pilih janji temu yang berstatus selesai lalu unggah berkasnya.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/patient/dashboard"
            className="rounded-lg border border-slate-200 px-4 py-2 text-slate-700 hover:bg-slate-100"
          >
            Kembali ke Dashboard
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
        {successMessage && (
          <div className="rounded-xl bg-green-50 text-green-700 px-4 py-3 text-sm">
            {successMessage}
          </div>
        )}

        <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CalendarCheck2 className="text-indigo-600" />
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Janji Temu Selesai
                </p>
                <p className="text-xs text-slate-500">
                  Unggah rekam medis untuk janji temu yang sudah selesai.
                </p>
              </div>
            </div>
            <button
              onClick={fetchAppointments}
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Muat Ulang
            </button>
          </div>

          {loading ? (
            <p className="text-center text-slate-500 py-4">
              Memuat janji temu...
            </p>
          ) : finishedAppointments.length === 0 ? (
            <div className="text-center text-slate-500 py-4">
              Belum ada janji temu yang selesai.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {finishedAppointments.map((apt) => {
                const alreadyUploaded = uploadedIds.includes(apt.id);
                return (
                  <div
                    key={apt.id}
                    className="rounded-2xl border border-slate-200 p-5 shadow-sm bg-slate-50/80 flex flex-col gap-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-slate-900">
                          {apt.doctorName}
                        </p>
                        {apt.doctorSpecialization && (
                          <p className="text-xs text-slate-600">
                            {apt.doctorSpecialization}
                          </p>
                        )}
                        <p className="text-sm text-slate-700">
                          {apt.date
                            ? new Date(apt.date).toLocaleString()
                            : "-"}
                        </p>
                      </div>
                      <span className="inline-flex items-center rounded-full bg-green-100 text-green-700 text-xs font-semibold px-3 py-1">
                        Selesai
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      {alreadyUploaded ? (
                        <span className="text-xs text-green-700 inline-flex items-center gap-2">
                          <NotebookPen size={14} />
                          Rekam medis telah diunggah
                        </span>
                      ) : (
                        <span className="text-xs text-slate-600">
                          Belum ada rekam medis.
                        </span>
                      )}
                      <div className="flex gap-2">
                        {alreadyUploaded && (
                          <button
                            onClick={() => {
                              if (uploadedRecords[apt.id]) {
                                setViewingRecord(uploadedRecords[apt.id]);
                                setShowViewModal(true);
                              } else {
                                fetchRecordByAppointmentId(apt.id);
                              }
                            }}
                            className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 text-indigo-700 px-4 py-2 text-sm font-semibold hover:bg-indigo-50"
                          >
                            <Eye size={16} />
                            Lihat Hasil
                          </button>
                        )}
                        {!alreadyUploaded && (
                          <button
                            onClick={() => startUpload(apt)}
                            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 text-white px-4 py-2 text-sm font-semibold hover:bg-indigo-700"
                          >
                            <FileUp size={16} />
                            Unggah Rekam
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-4 z-50">
          <div className="w-full max-w-xl bg-white rounded-2xl p-6 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-indigo-600 uppercase">
                  Unggah Rekam Medis
                </p>
                <h3 className="text-xl font-bold text-slate-900">
                  {selected.doctorName}
                </h3>
                <p className="text-sm text-slate-600">
                  {selected.date
                    ? new Date(selected.date).toLocaleString()
                    : "-"}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="rounded-full p-2 hover:bg-slate-100"
              >
                <X size={18} className="text-slate-500" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  File Rekam Medis (PDF/JPG/PNG)
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
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
                  placeholder="Catatan tambahan terkait kunjungan"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setSelected(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-slate-700 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading || !file}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 text-white px-5 py-2 font-semibold hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <FileUp size={16} />
                {uploading ? "Mengunggah..." : "Unggah"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal after upload */}
      <ModalDialog
        open={showSuccessModal}
        onOpenChange={setShowSuccessModal}
        title="Rekam Medis Berhasil Diunggah!"
        description="File rekam medis Anda telah berhasil diunggah. Anda dapat melihat detail hasil upload dengan mengklik tombol 'Lihat Hasil' pada janji temu yang bersangkutan."
        onDashboardClick={() => {
          setShowSuccessModal(false);
          fetchAppointments();
        }}
      />

      {/* View Upload Result Modal */}
      {viewingRecord && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-4 z-50">
          <div className="w-full max-w-2xl bg-white rounded-2xl p-6 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-indigo-600 uppercase">
                  Detail Rekam Medis
                </p>
                <h3 className="text-xl font-bold text-slate-900">
                  Hasil Upload Rekam Medis
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setViewingRecord(null);
                }}
                className="rounded-full p-2 hover:bg-slate-100"
              >
                <X size={18} className="text-slate-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
                <FileText className="text-slate-400 mt-1" size={20} />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-500 uppercase">
                    Nama File
                  </p>
                  <p className="text-slate-900 font-medium">
                    {viewingRecord.fileName}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
                <CalendarCheck2 className="text-slate-400 mt-1" size={20} />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-500 uppercase">
                    Tanggal Upload
                  </p>
                  <p className="text-slate-900 font-medium">
                    {new Date(viewingRecord.uploadedAt).toLocaleString("id-ID", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
                <FileText className="text-slate-400 mt-1" size={20} />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-500 uppercase">
                    Tipe File
                  </p>
                  <p className="text-slate-900 font-medium">
                    {viewingRecord.mimeType}
                  </p>
                </div>
              </div>

              {viewingRecord.noteContent && (
                <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
                  <NotebookPen className="text-slate-400 mt-1" size={20} />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-slate-500 uppercase">
                      Catatan
                    </p>
                    <p className="text-slate-900 font-medium">
                      {viewingRecord.noteContent}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4 text-green-600"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-green-800">
                    Status: Berhasil Diunggah
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    File rekam medis Anda telah tersimpan dengan aman.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4">
              <button
                onClick={async () => {
                  if (!viewingRecord) return;
                  try {
                    // Get file URL from backend
                    const res = await api.get(`/records/${viewingRecord.id}/download`);
                    const { filePath, fileName } = res.data;
                    
                    // Create download link
                    const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
                    const downloadUrl = `${baseURL}/uploads/${fileName}`;
                    
                    // Trigger download
                    const link = document.createElement('a');
                    link.href = downloadUrl;
                    link.download = fileName;
                    link.target = '_blank';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  } catch (err: any) {
                    console.error(err);
                    setError("Gagal mengunduh file. Coba lagi.");
                  }
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-indigo-600 text-indigo-600 px-6 py-2 font-semibold hover:bg-indigo-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Download File
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setViewingRecord(null);
                }}
                className="rounded-lg bg-indigo-600 text-white px-6 py-2 font-semibold hover:bg-indigo-700"
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

