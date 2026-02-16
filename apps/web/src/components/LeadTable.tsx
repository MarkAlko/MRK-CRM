'use client';

import type { Lead } from '@/lib/types';
import { formatPhoneDisplay } from '@/lib/phone';
import {
  getStatusLabel,
  getStatusColor,
  getTemperatureLabel,
  getTemperatureColor,
  getSourceLabel,
} from '@/lib/constants';
import StatusBadge from './StatusBadge';

interface LeadTableProps {
  leads: Lead[];
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onLeadClick: (lead: Lead) => void;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('he-IL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export default function LeadTable({
  leads,
  page,
  totalPages,
  onPageChange,
  onLeadClick,
}: LeadTableProps) {
  return (
    <div className="w-full">
      {/* Responsive table wrapper */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                שם
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                טלפון
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                סטטוס
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                טמפרטורה
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                מקור
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                תאריך
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {leads.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                  לא נמצאו לידים
                </td>
              </tr>
            )}
            {leads.map((lead) => (
              <tr
                key={lead.id}
                onClick={() => onLeadClick(lead)}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                  {lead.full_name}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap" dir="ltr">
                  {formatPhoneDisplay(lead.phone)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <StatusBadge status={lead.status} />
                </td>
                <td className="px-4 py-3 text-sm whitespace-nowrap">
                  {lead.temperature ? (
                    <span className={`font-medium ${getTemperatureColor(lead.temperature)}`}>
                      {getTemperatureLabel(lead.temperature)}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                  {getSourceLabel(lead.source)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                  {formatDate(lead.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-2">
          <p className="text-sm text-gray-600">
            עמוד {page} מתוך {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              הקודם
            </button>
            <button
              type="button"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              הבא
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
