'use client';

import { useAuthStore } from '../../store/authStore';

/**
 * RoleGate Component
 * Renders `children` if the current logged in user has one of the `allowedRoles`.
 * Otherwise renders `fallback` (defaults to null).
 */
export function RoleGate({ allowedRoles, children, fallback = null }) {
  const isRole = useAuthStore((state) => state.isRole);

  if (!isRole(...allowedRoles)) {
    return fallback;
  }

  return children;
}
