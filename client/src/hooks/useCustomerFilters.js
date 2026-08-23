'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback, useTransition } from 'react';

/**
 * Custom hook for URL-persistent Customer filter state
 */
export function useCustomerFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Extract current filters from URL query parameters
  const filters = {
    search: searchParams.get('search') || '',
    employmentType: searchParams.get('employmentType') || '',
    fromDate: searchParams.get('fromDate') || '',
    toDate: searchParams.get('toDate') || '',
    page: parseInt(searchParams.get('page') || '1', 10),
    limit: parseInt(searchParams.get('limit') || '20', 10),
  };

  // Update one or more filter parameters (resets page to 1 unless page is explicitly passed)
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

      if (!('page' in updates)) {
        params.set('page', '1');
      }

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [searchParams, router, pathname]
  );

  // Clear all filters
  const clearFilters = useCallback(() => {
    startTransition(() => {
      router.push(pathname, { scroll: false });
    });
  }, [router, pathname]);

  const hasActiveFilters = Boolean(
    filters.search || filters.employmentType || filters.fromDate || filters.toDate
  );

  const activeFilterCount = [
    filters.search,
    filters.employmentType,
    filters.fromDate || filters.toDate,
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
