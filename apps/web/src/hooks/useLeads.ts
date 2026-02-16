'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Lead, LeadFilters, PaginatedResponse } from '@/lib/types';
import { leadsApi } from '@/lib/api';

interface UseLeadsOptions {
  project_type_key?: string;
  filters?: Omit<LeadFilters, 'project_type_key' | 'page'>;
  pageSize?: number;
}

interface UseLeadsReturn {
  leads: Lead[];
  total: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  page: number;
  setPage: (page: number) => void;
  pages: number;
}

export function useLeads({
  project_type_key,
  filters = {},
  pageSize = 25,
}: UseLeadsOptions = {}): UseLeadsReturn {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const queryFilters: LeadFilters = {
      ...filters,
      page,
      page_size: pageSize,
    };

    if (project_type_key) {
      queryFilters.project_type_key = project_type_key;
    }

    leadsApi
      .list(queryFilters)
      .then((res: PaginatedResponse<Lead>) => {
        if (!cancelled) {
          setLeads(res.items);
          setTotal(res.total);
          setPages(res.pages);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'שגיאה בטעינת לידים');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
    // We stringify filters to create a stable dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project_type_key, page, pageSize, refreshKey, JSON.stringify(filters)]);

  return { leads, total, loading, error, refetch, page, setPage, pages };
}
