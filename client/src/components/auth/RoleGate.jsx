'use client';

import { useAuth } from '../../redux/hooks';

/**
 * RoleGate Component
 * Renders `children` if the current logged in user has one of the `allowedRoles`.
 * Otherwise renders `fallback` (defaults to null).
 */
export function RoleGate({ allowedRoles, children, fallback = null }) {
  const { isRole } = useAuth();

  if (!isRole(...allowedRoles)) {
    return fallback;
  }

  return children;
}
