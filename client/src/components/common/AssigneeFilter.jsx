'use client';

import { useState, useEffect } from 'react';
import { api } from '../../lib/api';

/**
 * Dropdown filter for selecting an executive assignee
 * @param {Object} props
 * @param {string} [props.value] - Currently selected executive user ID
 * @param {Function} props.onChange - Callback with user ID string or undefined
 */
export function AssigneeFilter({ value = '', onChange }) {
  const [executives, setExecutives] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchExecutives = async () => {
      setLoading(true);
      try {
        const res = await api.get('/users?role=EXECUTIVE');
        if (isMounted) {
          setExecutives(res.data || []);
        }
      } catch (err) {
        console.warn('Primary fetch to /users?role=EXECUTIVE failed, trying /admin/users:', err.message);
        try {
          const fallbackRes = await api.get('/admin/users?role=EXECUTIVE');
          if (isMounted) {
            setExecutives(fallbackRes.data || []);
          }
        } catch (fallbackErr) {
          console.error('Failed to fetch executives for assignee filter:', fallbackErr.message);
          if (isMounted) setExecutives([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchExecutives();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-1">
      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
        Assigned Executive
      </label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value || undefined)}
        disabled={loading}
        className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white text-slate-700 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:opacity-50"
      >
        <option value="">All Executives</option>
        {executives.map((user) => (
          <option key={user.id} value={String(user.id)}>
            {user.name} ({user.email})
          </option>
        ))}
      </select>
    </div>
  );
}
