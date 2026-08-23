'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, FileText, UserCheck, ShieldCheck, Building2 } from 'lucide-react';
import { useAuth } from '../../redux/hooks';
import { RoleGate } from '../auth/RoleGate';

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Applications', href: '/applications', icon: FileText },
    { name: 'Customers', href: '/customers', icon: Users },
  ];

  return (
    <aside className="w-64 bg-[#1A2B4C] text-slate-300 h-screen sticky top-0 flex flex-col flex-shrink-0 border-r border-[#16243F] overflow-y-auto z-30">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#16243F] flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-[#C5A059] flex items-center justify-center text-white font-bold text-lg shadow-md">
          Y
        </div>
        <div>
          <h1 className="font-bold text-white tracking-wide text-base">Y-Axis Home Loan</h1>
          <p className="text-xs text-slate-400">Origination Portal</p>
        </div>
      </div>

      {/* Scope / Branch Badge */}
      {user && (
        <div className="mx-4 my-4 p-3 rounded-lg bg-[#16243F] border border-[#2A3D6B]/60">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <Building2 className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Scope & Organization</span>
          </div>
          <p className="font-medium text-xs text-slate-200 truncate">
            {user.role === 'ADMIN' ? 'Global System Access' : user.teamName || 'Branch Team'}
          </p>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 px-3 space-y-1">
        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">
          Main Menu
        </div>

        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[#C5A059] text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#16243F]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              {item.name}
            </Link>
          );
        })}

        {/* Role Gated Admin Section */}
        <RoleGate allowedRoles={['ADMIN', 'MANAGER']}>
          <div className="pt-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">
            Administration
          </div>

          <Link
            href="/admin/sync-jobs"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              pathname.startsWith('/admin/sync-jobs')
                ? 'bg-[#C5A059] text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#16243F]'
            }`}
          >
            <Building2 className="w-4 h-4 text-emerald-400" />
            CBS Sync Jobs
          </Link>

          <RoleGate allowedRoles={['ADMIN']}>
            <Link
              href="/admin/users"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                pathname.startsWith('/admin/users')
                  ? 'bg-[#C5A059] text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#16243F]'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              User & Team Access
            </Link>
          </RoleGate>
        </RoleGate>
      </nav>

      {/* Footer User Info */}
      {user && (
        <div className="p-4 border-t border-[#16243F] bg-[#16243F]/40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-700 text-slate-200 flex items-center justify-center text-xs font-bold uppercase">
              {user.name ? user.name.slice(0, 2) : 'US'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{user.name}</p>
              <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
