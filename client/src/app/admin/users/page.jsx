'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { UserPlus, Users, Building2, Shield, Plus, X, Check, AlertCircle } from 'lucide-react';
import { api } from '../../../lib/api';
import { useAuth } from '../../../redux/hooks';

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, isRole, isLoading } = useAuth();

  const [usersList, setUsersList] = useState([]);
  const [teamsList, setTeamsList] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: 'Password@123',
    role: 'EXECUTIVE',
    teamName: '',
    teamId: '',
  });

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoadingData(true);
      const [usersRes, teamsRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/teams'),
      ]);

      if (usersRes.status === 'success') setUsersList(usersRes.data);
      if (teamsRes.status === 'success') setTeamsList(teamsRes.data);
    } catch (err) {
      console.error('Error fetching admin users data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (!isLoading) {
      if (!user || (!isRole('ADMIN') && !isRole('MANAGER'))) {
        router.push('/dashboard');
        return;
      }
      fetchData();
    }
  }, [user, isLoading]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setSubmitting(true);

    try {
      const res = await api.post('/admin/users', formData);
      if (res.status === 'success') {
        const msg = `User ${res.data.name} created successfully! 🎉`;
        setFormSuccess(msg);
        toast.success(msg);
        setFormData({
          name: '',
          email: '',
          password: 'Password@123',
          role: 'EXECUTIVE',
          teamName: '',
          teamId: '',
        });
        fetchData();
        setTimeout(() => setShowModal(false), 1200);
      }
    } catch (err) {
      const errMsg = err.message || 'Failed to create user';
      setFormError(errMsg);
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'MANAGER':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'EXECUTIVE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                User & Team Management
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Provision internal users, create branch teams, and enforce role-based access control.
              </p>
            </div>

            {isRole('ADMIN') && (
              <button
                onClick={() => {
                  setFormError('');
                  setFormSuccess('');
                  setShowModal(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-lg shadow-sm transition-colors flex items-center gap-2 text-sm"
              >
                <UserPlus className="w-4 h-4" />
                <span>Create User / Team</span>
              </button>
            )}
          </div>

          {/* Teams Overview Cards */}
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Active Branch Teams ({teamsList.length})</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {teamsList.map((team) => (
                <div
                  key={team.id}
                  className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-slate-900 text-base">{team.name}</h3>
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      Team #{team.id}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Branch Manager:</span>
                      <span className="font-medium text-slate-800">{team.managerName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Executives Assigned:</span>
                      <span className="font-bold text-slate-900">{team.memberCount} Officers</span>
                    </div>
                  </div>
                </div>
              ))}

              {teamsList.length === 0 && !loadingData && (
                <div className="col-span-3 p-6 text-center text-slate-500 bg-white rounded-xl border border-slate-200 text-sm">
                  No branch teams created yet. Create a Manager user to initialize a team.
                </div>
              )}
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-600" />
                  <span>User Accounts List ({usersList.length})</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Filtered by role permissions context ({user?.role})
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-500 font-semibold text-xs border-b border-slate-200 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">User Name</th>
                    <th className="px-6 py-3.5">Email Address</th>
                    <th className="px-6 py-3.5">Role</th>
                    <th className="px-6 py-3.5">Assigned Team</th>
                    <th className="px-6 py-3.5">Created Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900">{u.name}</td>
                      <td className="px-6 py-4 text-slate-600">{u.email}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getRoleBadgeClass(
                            u.role
                          )}`}
                        >
                          <Shield className="w-3 h-3" />
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-slate-800">{u.teamName}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-xs">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}

                  {usersList.length === 0 && !loadingData && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-400 text-sm">
                        No users found in your scope.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

      {/* User Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                  +
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Provision New User</h3>
                  <p className="text-xs text-slate-500">Create user account with RBAC role</p>
                </div>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2 font-medium">
                  <Check className="w-4 h-4 flex-shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. David Miller"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="david@yaxis.com"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Default Password</label>
                <input
                  type="text"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">System Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="EXECUTIVE">EXECUTIVE (Loan Officer)</option>
                  <option value="MANAGER">MANAGER (Branch / Team Lead)</option>
                  <option value="ADMIN">ADMIN (System Administrator)</option>
                </select>
              </div>

              {/* Dynamic Field: If Manager, require Team Name */}
              {formData.role === 'MANAGER' && (
                <div className="p-3.5 rounded-lg bg-blue-50/70 border border-blue-200">
                  <label className="block text-xs font-bold text-blue-900 mb-1">
                    New Team Name (Required for Managers)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.teamName}
                    onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
                    placeholder="e.g. Bangalore Branch"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-blue-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[11px] text-blue-700 mt-1">
                    Creating a Manager account automatically initializes a new branch team.
                  </p>
                </div>
              )}

              {/* Dynamic Field: If Executive, pick Team */}
              {formData.role === 'EXECUTIVE' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assign to Branch Team</label>
                  <select
                    value={formData.teamId}
                    onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">-- Select Branch Team --</option>
                    {teamsList.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} (Manager: {t.managerName})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
