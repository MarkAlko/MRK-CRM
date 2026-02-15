'use client';

import { useEffect, useState } from 'react';
import { leadsApi } from '@/lib/api';
import { PROJECT_TYPES, SOURCES, getSourceLabel } from '@/lib/constants';
import type { Lead, PaginatedResponse } from '@/lib/types';
import KPICard from '@/components/KPICard';
import { LeadsByProjectChart, LeadsBySourceChart } from '@/components/DashboardCharts';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const res = await leadsApi.list({ page_size: 100 });
      setLeads(res.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const now = new Date();
  const thisMonth = leads.filter((l) => {
    const created = new Date(l.created_at);
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  });

  const winsThisMonth = thisMonth.filter((l) => l.status === 'won').length;
  const leadsThisMonth = thisMonth.length;
  const conversionRate = leadsThisMonth > 0 ? ((winsThisMonth / leadsThisMonth) * 100).toFixed(1) : '0';

  const byProject = PROJECT_TYPES.map((pt) => ({
    name: pt.label,
    value: leads.filter((l) => {
      const ptKey = PROJECT_TYPES.find(p => p.key === pt.key);
      return ptKey !== undefined;
    }).length,
  }));

  // Count by project type using project_type_id mapping
  const projectCounts = [0, 0, 0, 0];
  leads.forEach((l) => {
    if (l.project_type_id >= 1 && l.project_type_id <= 4) {
      projectCounts[l.project_type_id - 1]++;
    }
  });

  const byProjectData = PROJECT_TYPES.map((pt, i) => ({
    name: pt.label,
    value: projectCounts[i],
  }));

  const sourceCounts: Record<string, number> = {};
  leads.forEach((l) => {
    const key = l.source || 'manual';
    sourceCounts[key] = (sourceCounts[key] || 0) + 1;
  });

  const bySourceData = Object.entries(sourceCounts).map(([key, count]) => ({
    name: getSourceLabel(key),
    value: count,
  }));

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="לוח בקרה" onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KPICard label="לידים החודש" value={leadsThisMonth} color="text-blue-600" />
                <KPICard label="זכיות החודש" value={winsThisMonth} color="text-green-600" />
                <KPICard label="אחוז המרה" value={`${conversionRate}%`} color="text-purple-600" />
                <KPICard label="סה״כ לידים" value={leads.length} color="text-gray-700" />
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <LeadsByProjectChart data={byProjectData} />
                <LeadsBySourceChart data={bySourceData} />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
