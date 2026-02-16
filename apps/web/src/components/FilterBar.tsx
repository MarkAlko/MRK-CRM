'use client';

import { useState } from 'react';
import {
  PIPELINE_STATUSES,
  TEMPERATURE_OPTIONS,
  SOURCES,
} from '@/lib/constants';
import type { LeadStatus, LeadTemperature, LeadSource } from '@/lib/types';

export interface FilterValues {
  status?: LeadStatus;
  temperature?: LeadTemperature;
  source?: LeadSource;
  bot_completed?: boolean;
}

interface FilterBarProps {
  onChange: (filters: FilterValues) => void;
  initialFilters?: FilterValues;
}

export default function FilterBar({ onChange, initialFilters = {} }: FilterBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<FilterValues>(initialFilters);

  function updateFilter(key: keyof FilterValues, value: string) {
    const next = { ...filters };

    if (key === 'bot_completed') {
      if (value === '') {
        delete next.bot_completed;
      } else {
        next.bot_completed = value === 'true';
      }
    } else if (key === 'status') {
      if (value === '') {
        delete next.status;
      } else {
        next.status = value as LeadStatus;
      }
    } else if (key === 'temperature') {
      if (value === '') {
        delete next.temperature;
      } else {
        next.temperature = value as LeadTemperature;
      }
    } else if (key === 'source') {
      if (value === '') {
        delete next.source;
      } else {
        next.source = value as LeadSource;
      }
    }

    setFilters(next);
    onChange(next);
  }

  function clearAll() {
    setFilters({});
    onChange({});
  }

  const hasActiveFilters =
    filters.status !== undefined ||
    filters.temperature !== undefined ||
    filters.source !== undefined ||
    filters.bot_completed !== undefined;

  return (
    <div className="w-full">
      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
          hasActiveFilters
            ? 'bg-primary-50 border-primary-300 text-primary-700'
            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}
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
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
          />
        </svg>
        <span>סינון</span>
        {hasActiveFilters && (
          <span className="inline-flex items-center justify-center w-5 h-5 text-xs bg-primary-600 text-white rounded-full">
            {Object.keys(filters).length}
          </span>
        )}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Collapsible filter section */}
      {isOpen && (
        <div className="mt-3 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Status dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                סטטוס
              </label>
              <select
                value={filters.status || ''}
                onChange={(e) => updateFilter('status', e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
              >
                <option value="">הכל</option>
                {PIPELINE_STATUSES.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Temperature dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                טמפרטורה
              </label>
              <select
                value={filters.temperature || ''}
                onChange={(e) => updateFilter('temperature', e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
              >
                <option value="">הכל</option>
                {TEMPERATURE_OPTIONS.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Source dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                מקור
              </label>
              <select
                value={filters.source || ''}
                onChange={(e) => updateFilter('source', e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
              >
                <option value="">הכל</option>
                {SOURCES.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Bot completed dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                בוט הושלם
              </label>
              <select
                value={filters.bot_completed === undefined ? '' : String(filters.bot_completed)}
                onChange={(e) => updateFilter('bot_completed', e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
              >
                <option value="">הכל</option>
                <option value="true">כן</option>
                <option value="false">לא</option>
              </select>
            </div>
          </div>

          {/* Clear all button */}
          {hasActiveFilters && (
            <div className="mt-3 flex justify-start">
              <button
                type="button"
                onClick={clearAll}
                className="text-sm text-red-600 hover:text-red-800 font-medium transition-colors"
              >
                נקה
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
