"use client";

import { useRouter } from "next/navigation";
import { getRedirectPathByRole, getStoredRole } from "@/lib/auth";
import Navbar from "@/components/navbar";
import { Phone } from "lucide-react";

export default function Home() {
  const router = useRouter();

  const handleBookAppointment = () => {
    const role = getStoredRole();
    const destination =
      role && role !== "" ? getRedirectPathByRole(role) : "/login";
    router.push(destination);
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <main className="relative bg-blue-600 overflow-hidden">
        {/* Abstract Wave Background */}
        <div className="absolute inset-0 opacity-20">
          <svg
            className="w-full h-full"
            viewBox="0 0 1200 800"
            preserveAspectRatio="none"
          >
            <path
              d="M0,400 Q300,300 600,400 T1200,400 L1200,800 L0,800 Z"
              fill="white"
            />
            <path
              d="M0,500 Q400,350 800,450 T1200,500 L1200,800 L0,800 Z"
              fill="white"
            />
          </svg>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-20 md:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Section - Content */}
            <div className="space-y-8 text-white">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                Book Your Doctor Appointment Online
              </h1>
              
              <div className="space-y-4 text-lg md:text-xl text-blue-50 leading-relaxed">
                <p>
                  A Healthier Tomorrow Starts Today: Schedule Your Appointment!
                </p>
                <p>
                  Your Wellness, Our Expertise: Set Up Your Appointment Today.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button
                  onClick={handleBookAppointment}
                  className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg border-2 border-blue-600 hover:bg-blue-50 transition-colors shadow-lg"
                >
                  Book An Appointment
                </button>
                <button
                  className="bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-800 transition-colors shadow-lg flex items-center justify-center gap-2"
                >
                  <Phone size={20} />
                  Call now
                </button>
              </div>
            </div>

            {/* Right Section - Doctor Image */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative w-full max-w-md">
                <div className="relative">
                  {/* Doctor illustration - using SVG and styled elements */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-2xl">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl overflow-hidden relative">
                      {/* Doctor figure representation */}
                      <div className="relative pt-8 pb-4 px-6 flex flex-col items-center">
                        {/* Head */}
                        <div className="w-32 h-32 bg-white/20 rounded-full mb-4 flex items-center justify-center relative">
                          <svg
                            className="w-24 h-24 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                        </div>
                        {/* Body/Stethoscope representation */}
                        <div className="w-40 h-48 bg-white/15 rounded-t-3xl flex flex-col items-center pt-4">
                          <div className="w-32 h-32 bg-white/10 rounded-full mb-2"></div>
                          {/* Stethoscope */}
                          <div className="flex items-center gap-2 mt-2">
                            <div className="w-8 h-8 bg-white/20 rounded-full"></div>
                            <div className="w-16 h-0.5 bg-white/30"></div>
                            <div className="w-8 h-8 bg-white/20 rounded-full"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Additional Sections Placeholder */}
      <section id="find-doctor" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-8">
            Find a Doctor
          </h2>
          <p className="text-center text-slate-600">
            Search and book appointments with qualified doctors in your area.
          </p>
        </div>
      </section>

      <section id="services" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-8">
            Our Services
          </h2>
          <p className="text-center text-slate-600">
            Comprehensive healthcare services tailored to your needs.
          </p>
        </div>
      </section>

      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-8">
            About Us
          </h2>
          <p className="text-center text-slate-600">
            Your trusted partner in healthcare management.
          </p>
        </div>
      </section>

      <section id="contact" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-8">
            Contact Us
          </h2>
          <p className="text-center text-slate-600">
            Get in touch with us for any inquiries or support.
          </p>
        </div>
      </section>
    </div>
  );
}
