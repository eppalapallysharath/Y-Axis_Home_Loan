"use client";

import { useState } from "react";
import Link from "next/link";
import {
  UserPlus,
  FileCheck2,
  Scale,
  Building2,
  Users,
  GitCommit,
  ShieldLock,
  RefreshCw,
  ShieldCheck,
  User,
  Sliders,
  CheckCircle2,
  Activity,
  Layers,
  ArrowRight,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";

export default function LandingPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState("crm");

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#1A2B4C] font-sans antialiased">
      {/* ── 1. Header / Navbar ── */}
      <header className="w-full bg-white border-b border-[#E2E8F0] px-6 md:px-16 py-4 flex items-center justify-between sticky top-0 z-50 shadow-xs">
        <Link href="/" className="text-xl font-bold tracking-tight text-[#1A2B4C]">
          Y-Axis Operations
        </Link>

        <div className="flex items-center gap-3">
          {user ? (
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-sm font-semibold text-[#1A2B4C] hover:text-[#7A5B28] transition-colors"
            >
              <User className="w-4 h-4 text-[#7A5B28]" />
              <span>Dashboard ({user.name})</span>
            </Link>
          ) : (
            <Link
              href="/login"
              id="header-login-btn"
              className="flex items-center gap-2 text-sm font-semibold text-[#1A2B4C] hover:text-[#7A5B28] transition-colors px-3 py-1.5 rounded-lg border border-transparent hover:border-[#E2E8F0]"
            >
              <User className="w-4 h-4 text-[#1A2B4C]" />
              <span>Login</span>
            </Link>
          )}
        </div>
      </header>

      {/* ── 2. Hero Section ── */}
      <section className="w-full max-w-7xl mx-auto px-6 md:px-12 py-12 md:py-16 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        {/* Left Column */}
        <div className="lg:col-span-7 space-y-6">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#1A2B4C] tracking-tight leading-tight">
            Y-Axis Internal Operations Portal
          </h1>
          <p className="text-base md:text-lg text-[#64748B] max-w-xl leading-relaxed">
            Manage the end-to-end loan lifecycle, from applicant intake and document verification to underwriting and final CBS disbursal.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href={user ? "/applications" : "/login"}
              id="view-task-queue-btn"
              className="px-6 py-3 bg-[#7A5B28] hover:bg-[#63491F] text-white font-semibold text-sm rounded-md shadow-sm transition-colors"
            >
              View Task Queue
            </Link>
            <Link
              href={user ? "/applications/new" : "/login"}
              id="new-application-btn"
              className="px-6 py-3 border border-[#1A2B4C] text-[#1A2B4C] hover:bg-[#F1F5F9] font-semibold text-sm rounded-md transition-colors"
            >
              New Application
            </Link>
          </div>
        </div>

        {/* Right Column: System Status Card */}
        <div className="lg:col-span-5 w-full">
          <div className="bg-white rounded-xl p-6 shadow-md border border-[#E2E8F0]">
            {/* Card Header */}
            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-[#F1F5F9]">
              <Activity className="w-4 h-4 text-[#7A5B28]" />
              <h3 className="text-base font-bold text-[#1A2B4C]">System Status</h3>
            </div>

            {/* Status Rows */}
            <div className="space-y-3.5 text-xs md:text-sm">
              <div className="flex items-center justify-between py-1">
                <span className="text-[#64748B] font-medium">Active Applications</span>
                <span className="font-bold text-[#1A2B4C]">1,248</span>
              </div>
              <div className="flex items-center justify-between py-1 border-t border-[#F1F5F9]">
                <span className="text-[#64748B] font-medium">Pending Verifications</span>
                <span className="font-bold text-[#1A2B4C]">342</span>
              </div>
              <div className="flex items-center justify-between py-1 border-t border-[#F1F5F9]">
                <span className="text-[#64748B] font-medium">CBS Sync Status</span>
                <span className="font-semibold text-emerald-600 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Online
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-t border-[#F1F5F9]">
                <span className="text-[#64748B] font-medium">Server Load</span>
                <span className="font-semibold text-[#1A2B4C]">Normal</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Operational Workflow Stages ── */}
      <section className="w-full bg-[#F8FAFC] py-16 border-t border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <h2 className="text-2xl md:text-3xl font-extrabold text-center text-[#1A2B4C] mb-12 tracking-tight">
            Operational Workflow Stages
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Stage 1 */}
            <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-2xs hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-full bg-[#1A2B4C] text-white flex items-center justify-center mb-4">
                <UserPlus className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-[#1A2B4C] mb-2">
                1. Intake & CRM
              </h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Initial applicant data capture and CRM profiling. Access restricted to Sales and Intake officers. Full audit trail logged.
              </p>
            </div>

            {/* Stage 2 */}
            <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-2xs hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-[#7A5B28] flex items-center justify-center mb-4 font-bold border border-amber-200">
                <FileCheck2 className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-[#1A2B4C] mb-2">
                2. Verification Queue
              </h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                KYC and document validation stage. Role-governed access for Compliance team with strict verification logging.
              </p>
            </div>

            {/* Stage 3 */}
            <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-2xs hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-full bg-[#1A2B4C] text-white flex items-center justify-center mb-4">
                <Scale className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-[#1A2B4C] mb-2">
                3. Underwriting
              </h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Risk assessment and final approval workflows. Accessed by Credit Underwriters. All decisions are immutably tracked.
              </p>
            </div>

            {/* Stage 4 */}
            <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-2xs hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-full bg-[#1A2B4C] text-white flex items-center justify-center mb-4">
                <Building2 className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-[#1A2B4C] mb-2">
                4. CBS Disbursal
              </h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Automated synchronization with Core Banking System for funds transfer. Overseen by Finance with audit reporting.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. System Capabilities ── */}
      <section className="w-full bg-[#F8FAFC] py-16 border-t border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <h2 className="text-2xl md:text-3xl font-extrabold text-center text-[#1A2B4C] mb-12 tracking-tight">
            System Capabilities
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Capabilities List */}
            <div className="lg:col-span-6 space-y-6">
              <div
                onClick={() => setActiveTab("crm")}
                className={`p-4 rounded-xl transition-all cursor-pointer border ${
                  activeTab === "crm"
                    ? "bg-white border-[#7A5B28] shadow-sm"
                    : "hover:bg-white/60 border-transparent"
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <Users className="w-5 h-5 text-[#7A5B28] shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold text-[#1A2B4C]">Applicant CRM</h3>
                    <p className="text-xs text-[#64748B] leading-relaxed mt-1">
                      Comprehensive profile management, interaction history, and document repository for every applicant.
                    </p>
                  </div>
                </div>
              </div>

              <div
                onClick={() => setActiveTab("tracking")}
                className={`p-4 rounded-xl transition-all cursor-pointer border ${
                  activeTab === "tracking"
                    ? "bg-white border-[#7A5B28] shadow-sm"
                    : "hover:bg-white/60 border-transparent"
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <GitCommit className="w-5 h-5 text-[#7A5B28] shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold text-[#1A2B4C]">End-to-End Tracking</h3>
                    <p className="text-xs text-[#64748B] leading-relaxed mt-1">
                      Real-time visibility into application status across all workflow stages with automated SLA monitoring.
                    </p>
                  </div>
                </div>
              </div>

              <div
                onClick={() => setActiveTab("rbac")}
                className={`p-4 rounded-xl transition-all cursor-pointer border ${
                  activeTab === "rbac"
                    ? "bg-white border-[#7A5B28] shadow-sm"
                    : "hover:bg-white/60 border-transparent"
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <ShieldLock className="w-5 h-5 text-[#7A5B28] shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold text-[#1A2B4C]">Role-Based Access</h3>
                    <p className="text-xs text-[#64748B] leading-relaxed mt-1">
                      Granular permissions ensuring staff only access data and perform actions relevant to their organizational role.
                    </p>
                  </div>
                </div>
              </div>

              <div
                onClick={() => setActiveTab("cbs")}
                className={`p-4 rounded-xl transition-all cursor-pointer border ${
                  activeTab === "cbs"
                    ? "bg-white border-[#7A5B28] shadow-sm"
                    : "hover:bg-white/60 border-transparent"
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <RefreshCw className="w-5 h-5 text-[#7A5B28] shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold text-[#1A2B4C]">CBS Sync Reliability</h3>
                    <p className="text-xs text-[#64748B] leading-relaxed mt-1">
                      Robust, fault-tolerant integration with the Core Banking System for seamless account creation and disbursal.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Capabilities Visualization Box */}
            <div className="lg:col-span-6 w-full">
              <div className="bg-white rounded-2xl p-6 md:p-8 border border-[#E2E8F0] shadow-md min-h-[320px] flex flex-col justify-center items-center text-center relative overflow-hidden">
                {activeTab === "crm" && (
                  <div className="space-y-3 max-w-sm animate-fadeIn">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 text-[#7A5B28] flex items-center justify-center mx-auto border border-amber-200">
                      <Users className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-[#1A2B4C] text-base">Applicant CRM Module</h4>
                    <p className="text-xs text-[#64748B]">Centralized customer profiles linked with PAN verification, credit rating metrics, and branch mapping.</p>
                  </div>
                )}

                {activeTab === "tracking" && (
                  <div className="space-y-3 max-w-sm animate-fadeIn">
                    <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center mx-auto border border-sky-200">
                      <GitCommit className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-[#1A2B4C] text-base">Workflow Pipeline</h4>
                    <p className="text-xs text-[#64748B]">Live lifecycle tracking: NEW ➔ WAITING ➔ IN_PROGRESS ➔ UNDER_REVIEW ➔ COMPLETED.</p>
                  </div>
                )}

                {activeTab === "rbac" && (
                  <div className="space-y-3 max-w-sm animate-fadeIn">
                    <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mx-auto border border-purple-200">
                      <ShieldLock className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-[#1A2B4C] text-base">Role Hierarchy & Scoping</h4>
                    <p className="text-xs text-[#64748B]">Admin, Manager (Team level), and Executive scoped permissions across application tables.</p>
                  </div>
                )}

                {activeTab === "cbs" && (
                  <div className="space-y-3 max-w-sm animate-fadeIn">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-200">
                      <RefreshCw className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-[#1A2B4C] text-base">Core Banking Integration</h4>
                    <p className="text-xs text-[#64748B]">Automated async background queue with exponential backoff and retry monitoring.</p>
                  </div>
                )}

                <div className="mt-6 pt-4 border-t border-[#F1F5F9] w-full text-[11px] text-[#94A3B8]">
                  Interactive Capabilities Visualization
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. Secure Banner Strip ── */}
      <section className="w-full bg-[#1A2B4C] text-white py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 text-center text-xs md:text-sm">
          <ShieldCheck className="w-4 h-4 text-[#C5A059] shrink-0" />
          <p className="font-medium">
            <span className="font-bold">Secure Operational Environment:</span> All actions are recorded in a strict audit trail, ensuring compliance and operational integrity across the Y-Axis network.
          </p>
        </div>
      </section>

      {/* ── 6. Footer ── */}
      <footer className="w-full bg-[#E2E8F0]/40 border-t border-[#E2E8F0] py-8 px-6 md:px-16 mt-auto">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm font-bold text-[#1A2B4C]">
              Y-Axis Internal Operations
            </div>

            <div className="flex flex-wrap items-center gap-6 text-xs text-[#64748B] font-medium">
              <a href="#" className="underline hover:text-[#1A2B4C] transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-[#1A2B4C] transition-colors">
                Terms of Service
              </a>
              <a href="#" className="hover:text-[#1A2B4C] transition-colors">
                IT Support
              </a>
              <a href="#" className="hover:text-[#1A2B4C] transition-colors">
                Internal Policies
              </a>
            </div>
          </div>

          <div className="border-t border-[#CBD5E1]/60 pt-4 text-center md:text-left text-xs text-[#64748B]">
            © 2024 Y-Axis Operations Portal. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
