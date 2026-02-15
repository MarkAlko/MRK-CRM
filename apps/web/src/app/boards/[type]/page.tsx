'use client';

import { useState, useCallback, useMemo } from 'react';
import { useParams, notFound } from 'next/navigation';
import { getProjectTypeByPath, PIPELINE_STATUSES, PROJECT_TYPES } from '@/lib/constants';
import { leadsApi } from '@/lib/api';
import { useLeads } from '@/hooks/useLeads';
import type { Lead, LeadStatus } from '@/lib/types';
import type { FilterValues } from '@/components/FilterBar';

import ProtectedRoute from '@/components/ProtectedRoute';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import FilterBar from '@/components/FilterBar';
import KanbanBoard from '@/components/KanbanBoard';
import LeadTable from '@/components/LeadTable';
import LeadDrawer from '@/components/LeadDrawer';

type ViewMode = 'kanban' | 'table';

export default function BoardPage() {
  const params = useParams<{ type: string }>();
  const typePath = params.type;

  const projectType = getProjectTypeByPath(typePath);

  // --- UI state ---
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<FilterValues>({});
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Build the filter object for the hook
  const combinedFilters = useMemo(
    () => ({
      ...filters,
      ...(search.trim() ? { search: search.trim() } : {}),
    }),
    [filters, search],
  );

  // Fetch leads
  const {
    leads,
    loading,
    error,
    refetch,
    page,
    setPage,
    pages,
  } = useLeads({
    project_type_key: projectType?.key,
    filters: combinedFilters,
    pageSize: viewMode === 'kanban' ? 200 : 25,
  });

  // --- Handlers ---

  const handleFilterChange = useCallback((newFilters: FilterValues) => {
    setFilters(newFilters);
    setPage(1);
  }, [setPage]);

  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearch(e.target.value);
      setPage(1);
    },
    [setPage],
  );

  const handleLeadClick = useCallback((lead: Lead) => {
    setSelectedLead(lead);
    setDrawerOpen(true);
  }, []);

  const handleTransition = useCallback(
    async (leadId: string, newStatus: LeadStatus) => {
      try {
        await leadsApi.transition(leadId, newStatus);
        refetch();
      } catch (err) {
        console.error('שגיאה בעדכון סטטוס:', err);
      }
    },
    [refetch],
  );

  const handleCreateLead = useCallback(() => {
    // Placeholder for a create lead modal/drawer
    // For now, navigate to a create page or show an alert
    alert('פתיחת טופס ליד חדש - ניתן לממש דרך דיאלוג נפרד');
  }, []);

  // If the type path is invalid, show 404
  if (!projectType) {
    notFound();
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-50">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex-1 flex flex-col min-w-0 lg:mr-64">
          <Header
            title={projectType.label}
            onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          />

          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            {/* Top toolbar */}
            <div className="space-y-4 mb-6">
              {/* Row 1: View toggle + Search + New lead button */}
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                {/* View toggle */}
                <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setViewMode('kanban')}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      viewMode === 'kanban'
                        ? 'bg-primary-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    קנבן
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      viewMode === 'table'
                        ? 'bg-primary-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    טבלה
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  {/* Search */}
                  <div className="relative flex-1 sm:flex-none sm:w-80">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    <input
                      type="text"
                      value={search}
                      onChange={handleSearch}
                      placeholder="חיפוש לפי שם, טלפון או אימייל..."
                      className="w-full rounded-lg border border-gray-300 bg-white py-2 pr-10 pl-4 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                    />
                  </div>

                  {/* New lead button */}
                  <button
                    type="button"
                    onClick={handleCreateLead}
                    className="inline-flex items-center gap-1 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors whitespace-nowrap"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    ליד חדש
                  </button>
                </div>
              </div>

              {/* Row 2: Filters */}
              <FilterBar onChange={handleFilterChange} />
            </div>

            {/* Loading state */}
            {loading && (
              <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
                  <p className="text-sm text-gray-500">טוען לידים...</p>
                </div>
              </div>
            )}

            {/* Error state */}
            {error && !loading && (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <p className="text-sm text-red-600 mb-2">{error}</p>
                  <button
                    type="button"
                    onClick={refetch}
                    className="text-sm text-primary-600 hover:text-primary-800 font-medium"
                  >
                    נסה שוב
                  </button>
                </div>
              </div>
            )}

            {/* Content */}
            {!loading && !error && (
              <>
                {viewMode === 'kanban' ? (
                  <KanbanBoard
                    leads={leads}
                    statuses={PIPELINE_STATUSES}
                    onTransition={handleTransition}
                    onLeadClick={handleLeadClick}
                  />
                ) : (
                  <LeadTable
                    leads={leads}
                    page={page}
                    totalPages={pages}
                    onPageChange={setPage}
                    onLeadClick={handleLeadClick}
                  />
                )}
              </>
            )}
          </main>
        </div>

        <LeadDrawer
          lead={selectedLead}
          isOpen={drawerOpen}
          onClose={() => { setDrawerOpen(false); setSelectedLead(null); }}
          onUpdate={() => { refetch(); }}
        />
      </div>
    </ProtectedRoute>
  );
}
