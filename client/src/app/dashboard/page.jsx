"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Users,
  Shield,
  Building2,
  AlertTriangle,
  ArrowRight,
  Loader2,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../../redux/hooks";
import { api } from "../../lib/api";
import CbsHealthWidget from "../../components/cbs/CbsHealthWidget";
import StageBadge from "../../components/applications/StageBadge";
import PriorityBadge from "../../components/applications/PriorityBadge";
import { MetricCardSkeleton } from "../../components/common/Skeleton";

export default function DashboardPage() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState({
    total: 0,
    inProgress: 0,
    underReview: 0,
    cbsFailed: 0,
    stageCounts: {
      NEW: 0,
      WAITING_FOR_INFO: 0,
      IN_PROGRESS: 0,
      UNDER_REVIEW: 0,
      COMPLETED: 0,
      REJECTED: 0,
    },
  });
  const [recentApplications, setRecentApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        // Fetch recent applications list
        const res = await api.get("/applications?limit=5&page=1");
        const apps = res.data || res.applications || [];
        setRecentApplications(apps);

        // Fetch overall stage breakdown if available or calculate from returned list/pagination
        const totalCount = res.pagination?.total || apps.length;

        // Calculate counts from apps list or default
        let inProg = 0;
        let underRev = 0;
        let failedCbs = 0;
        const counts = {
          NEW: 0,
          WAITING_FOR_INFO: 0,
          IN_PROGRESS: 0,
          UNDER_REVIEW: 0,
          COMPLETED: 0,
          REJECTED: 0,
        };

        apps.forEach((app) => {
          if (app.stage) {
            counts[app.stage] = (counts[app.stage] || 0) + 1;
          }
          if (app.stage === "IN_PROGRESS") inProg++;
          if (app.stage === "UNDER_REVIEW") underRev++;
          if (
            app.cbsSyncStatus === "FAILED" ||
            app.cbsSyncStatus === "EXHAUSTED"
          )
            failedCbs++;
        });

        setMetrics({
          total: totalCount,
          inProgress: inProg,
          underReview: underRev,
          cbsFailed: failedCbs,
          stageCounts: counts,
        });
      } catch (err) {
        console.error("Failed to load dashboard metrics:", err);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const getRoleDescription = (role) => {
    switch (role) {
      case "ADMIN":
        return "System Administrator — Unrestricted access to all teams, users, customers, and applications across the organization.";
      case "MANAGER":
        return `Branch Team Manager — Oversees applications assigned to members of ${user?.teamName || "your branch team"}.`;
      case "EXECUTIVE":
        return "Loan Officer — Manages and moves forward loan applications assigned directly to you.";
      default:
        return "";
    }
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "₹0";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg border border-slate-700/80">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-400" />
                {user?.role} WORKSPACE
              </span>
              {user?.teamName && (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-700/60 text-slate-300 border border-slate-600 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  {user.teamName}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Welcome back, {user?.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              {getRoleDescription(user?.role)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/applications/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shadow-md"
            >
              <FileText className="w-4 h-4" />
              <span>+ New Application</span>
            </Link>
          </div>
        </div>
      </div>

      {/* CBS Failed Jobs Alert Banner (if any) */}
      {metrics.cbsFailed > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-center justify-between gap-4 text-amber-900 text-xs">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold">
                Attention: {metrics.cbsFailed} CBS Synchronization Jobs Failed
              </p>
              <p className="text-amber-700">
                Some background core banking updates failed. Review sync monitor
                for retry options.
              </p>
            </div>
          </div>
          <Link
            href="/admin/sync-jobs"
            className="px-3 py-1.5 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 transition-colors shrink-0"
          >
            Resolve Sync Jobs →
          </Link>
        </div>
      )}

      {/* Operational Metrics Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Total Applications
              </span>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
                {metrics.total}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                In authorized scope
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-5.5 h-5.5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-sky-600 uppercase tracking-wider">
                In Progress
              </span>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
                {metrics.inProgress}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Underwriting active
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <TrendingUp className="w-5.5 h-5.5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-purple-600 uppercase tracking-wider">
                Pending Review
              </span>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
                {metrics.underReview}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Awaiting decision</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Clock className="w-5.5 h-5.5" />
            </div>
          </div>

          {/* <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Access Scope
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-1 truncate max-w-[130px]">
                {user?.role === 'ADMIN' ? 'Global' : user?.teamName || 'Team'}
              </h3>
              <p className="text-xs text-emerald-600 font-medium mt-0.5 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Scoped API
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Building2 className="w-5.5 h-5.5" />
            </div>
          </div> */}
        </div>
      )}

      {/* Main Grid: Recent Applications + Stage Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Applications Table (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Recent Applications
              </h2>
              <p className="text-xs text-slate-500">
                Latest active loan applications in pipeline
              </p>
            </div>
            <Link
              href="/applications"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex-1 overflow-x-auto">
            {recentApplications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No recent applications found.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">App ID</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Loan Amount</th>
                    <th className="py-3 px-4">Stage</th>
                    <th className="py-3 px-4">Priority</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {recentApplications.map((app) => (
                    <tr
                      key={app.id}
                      onClick={() =>
                        (window.location.href = `/applications/${app.id}`)
                      }
                      className="hover:bg-slate-50 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-blue-600 group-hover:underline">
                        #
                        {app.id
                          ? String(app.id).slice(-6).toUpperCase()
                          : "APP"}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {app.customer?.fullName || "Applicant"}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {formatCurrency(app.loanAmount || app.requestedAmount)}
                      </td>
                      <td className="py-3 px-4">
                        <StageBadge stage={app.stage} />
                      </td>
                      <td className="py-3 px-4">
                        <PriorityBadge priority={app.priority} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Stage Breakdown & Distribution (1 Col) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-1">
              Stage Distribution
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Pipeline count breakdown by stage
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between font-semibold mb-1 text-slate-700">
                  <span>New Applications</span>
                  <span>{metrics.stageCounts.NEW}</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-slate-500 h-full rounded-full transition-all"
                    style={{
                      width: `${
                        metrics.total > 0
                          ? (metrics.stageCounts.NEW / metrics.total) * 100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold mb-1 text-amber-700">
                  <span>Waiting for Info</span>
                  <span>{metrics.stageCounts.WAITING_FOR_INFO}</span>
                </div>
                <div className="w-full bg-amber-50 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all"
                    style={{
                      width: `${
                        metrics.total > 0
                          ? (metrics.stageCounts.WAITING_FOR_INFO /
                              metrics.total) *
                            100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold mb-1 text-sky-700">
                  <span>In Progress</span>
                  <span>{metrics.stageCounts.IN_PROGRESS}</span>
                </div>
                <div className="w-full bg-sky-50 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-sky-500 h-full rounded-full transition-all"
                    style={{
                      width: `${
                        metrics.total > 0
                          ? (metrics.stageCounts.IN_PROGRESS / metrics.total) *
                            100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold mb-1 text-purple-700">
                  <span>Under Review</span>
                  <span>{metrics.stageCounts.UNDER_REVIEW}</span>
                </div>
                <div className="w-full bg-purple-50 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-purple-500 h-full rounded-full transition-all"
                    style={{
                      width: `${
                        metrics.total > 0
                          ? (metrics.stageCounts.UNDER_REVIEW / metrics.total) *
                            100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold mb-1 text-emerald-700">
                  <span>Completed / Approved</span>
                  <span>{metrics.stageCounts.COMPLETED}</span>
                </div>
                <div className="w-full bg-emerald-50 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all"
                    style={{
                      width: `${
                        metrics.total > 0
                          ? (metrics.stageCounts.COMPLETED / metrics.total) *
                            100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-center">
            <Link
              href="/applications"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Open Full Applications Pipeline →
            </Link>
          </div>
        </div>
      </div>

      {/* CBS Health Monitor Widget for Managers / Admins */}
      {user && (user.role === "ADMIN" || user.role === "MANAGER") && (
        <CbsHealthWidget />
      )}
    </div>
  );
}
