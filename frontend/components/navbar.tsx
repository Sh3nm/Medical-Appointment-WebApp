"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { getStoredRole, getRedirectPathByRole } from "@/lib/auth";
import { Circle } from "lucide-react";

export default function Navbar() {
  const router = useRouter();

  const handleBookAppointment = () => {
    const role = getStoredRole();
    const destination =
      role && role !== "" ? getRedirectPathByRole(role) : "/login";
    router.push(destination);
  };

  return (
    <nav className="bg-white shadow-sm border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-xl">D</span>
            </div>
            <span className="text-2xl font-bold text-slate-900">octor</span>
          </Link>

          {/* Navigation Menu */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className="text-slate-700 hover:text-blue-600 font-medium transition-colors"
            >
              Home
            </Link>
            <Link
              href="/#find-doctor"
              className="text-slate-700 hover:text-blue-600 font-medium transition-colors"
            >
              Find a Doctor
            </Link>
            <Link
              href="/#services"
              className="text-slate-700 hover:text-blue-600 font-medium transition-colors"
            >
              Services
            </Link>
            <Link
              href="/#about"
              className="text-slate-700 hover:text-blue-600 font-medium transition-colors"
            >
              About Us
            </Link>
            <Link
              href="/#contact"
              className="text-slate-700 hover:text-blue-600 font-medium transition-colors"
            >
              Contact
            </Link>
          </div>

          {/* Book Appointment Button */}
          <button
            onClick={handleBookAppointment}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Book An Appointment
          </button>
        </div>
      </div>
    </nav>
  );
}

