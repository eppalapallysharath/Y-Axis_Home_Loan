'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback, useTransition } from 'react';

/**
 * Custom hook for URL-persistent Application filter state
 */
export function useApplicationFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Extract current filters from URL query parameters
  const filters = {
    search: searchParams.get('search') || '',
    stage: searchParams.get('stage') || '',
    priority: searchParams.get('priority') || '',
    loanType: searchParams.get('loanType') || '',
    assignedToId: searchParams.get('assignedToId') || '',
    fromDate: searchParams.get('fromDate') || '',
    toDate: searchParams.get('toDate') || '',
    cbsSyncStatus: searchParams.get('cbsSyncStatus') || '',
    page: parseInt(searchParams.get('page') || '1', 10),
    limit: parseInt(searchParams.get('limit') || '20', 10),
  };

  // Update one or more filter parameters (always resets page to 1 unless page is explicitly passed)
  const setFilter = useCallback(
    (updates) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === '' || value === null) {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });

      // Reset to page 1 when filters change (unless page is explicitly updated)
      if (!('page' in updates)) {
        params.set('page', '1');
      }

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [searchParams, router, pathname]
  );

  // Clear all filters except default pagination
  const clearFilters = useCallback(() => {
    startTransition(() => {
      router.push(pathname, { scroll: false });
    });
  }, [router, pathname]);

  const hasActiveFilters = Boolean(
    filters.search ||
      filters.stage ||
      filters.priority ||
      filters.loanType ||
      filters.assignedToId ||
      filters.fromDate ||
      filters.toDate ||
      filters.cbsSyncStatus
  );

  // Calculate active filter count for badge display
  const activeFilterCount = [
    filters.search,
    filters.stage,
    filters.priority,
    filters.loanType,
    filters.assignedToId,
    filters.fromDate || filters.toDate,
    filters.cbsSyncStatus,
  ].filter(Boolean).length;

  return {
    filters,
    setFilter,
    clearFilters,
    hasActiveFilters,
    activeFilterCount,
    isPending,
  };
}
