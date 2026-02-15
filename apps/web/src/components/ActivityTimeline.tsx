'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { activitiesApi } from '@/lib/api';
import { ACTIVITY_TYPES } from '@/lib/constants';
import type { Activity, ActivityType } from '@/lib/types';

/* ──────────────────────────────────────────────
   Hebrew "time ago" helper
   ────────────────────────────────────────────── */

function timeAgoHe(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (seconds < 60) return 'לפני רגע';
  if (minutes < 60) return `לפני ${minutes} דקות`;
  if (hours < 24) return `לפני ${hours} שעות`;
  if (days < 7) return `לפני ${days} ימים`;
  if (weeks < 4) return `לפני ${weeks} שבועות`;
  return `לפני ${months} חודשים`;
}

/* ──────────────────────────────────────────────
   Activity type icon/color
   ────────────────────────────────────────────── */

function getActivityIcon(type: ActivityType): React.ReactNode {
  switch (type) {
    case 'call':
      return (
        <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
        </svg>
      );
    case 'meeting':
      return (
        <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
      );
    case 'note':
      return (
        <svg className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
        </svg>
      );
    case 'offer_sent':
      return (
        <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
        </svg>
      );
    default:
      return (
        <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
}

function getActivityBgColor(type: ActivityType): string {
  switch (type) {
    case 'call': return 'bg-blue-50 border-blue-200';
    case 'meeting': return 'bg-purple-50 border-purple-200';
    case 'note': return 'bg-yellow-50 border-yellow-200';
    case 'offer_sent': return 'bg-green-50 border-green-200';
    default: return 'bg-gray-50 border-gray-200';
  }
}

function getActivityTypeLabel(type: string): string {
  return ACTIVITY_TYPES.find((a) => a.key === type)?.label ?? type;
}

/* ──────────────────────────────────────────────
   Component
   ────────────────────────────────────────────── */

interface ActivityTimelineProps {
  leadId: string;
}

export default function ActivityTimeline({ leadId }: ActivityTimelineProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formType, setFormType] = useState<ActivityType>('call');
  const [formDescription, setFormDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await activitiesApi.listByLead(leadId);
      setActivities(data);
    } catch (err) {
      setError('שגיאה בטעינת הפעילויות');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formDescription.trim()) {
      setFormError('יש להזין תיאור');
      return;
    }

    try {
      setSubmitting(true);
      await activitiesApi.create({
        lead_id: leadId,
        type: formType,
        description: formDescription.trim(),
      });
      setFormDescription('');
      setFormType('call');
      await fetchActivities();
    } catch (err) {
      setFormError('שגיאה בהוספת הפעילות');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div dir="rtl" className="space-y-6">
      {/* ── Add activity form ─────────────────── */}
      <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
        <h4 className="text-sm font-semibold text-gray-700">הוספת פעילות חדשה</h4>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">סוג פעילות</label>
          <select
            value={formType}
            onChange={(e) => setFormType(e.target.value as ActivityType)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {ACTIVITY_TYPES.map((at) => (
              <option key={at.key} value={at.key}>
                {at.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">תיאור</label>
          <textarea
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
            rows={3}
            placeholder="הוסף תיאור לפעילות..."
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
          />
        </div>

        {formError && <p className="text-sm text-red-600">{formError}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? 'שומר...' : 'הוסף פעילות'}
        </button>
      </form>

      {/* ── Timeline ──────────────────────────── */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      ) : error ? (
        <p className="text-center text-sm text-red-600 py-4">{error}</p>
      ) : activities.length === 0 ? (
        <p className="text-center text-sm text-gray-500 py-8">אין פעילויות עדיין</p>
      ) : (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute right-4 top-0 bottom-0 w-0.5 bg-gray-200" />

          <ul className="space-y-4">
            {activities.map((activity) => (
              <li key={activity.id} className="relative pr-10">
                {/* Dot on the timeline */}
                <div className="absolute right-2.5 top-3 flex h-3 w-3 items-center justify-center">
                  <div className="h-3 w-3 rounded-full bg-white border-2 border-gray-400" />
                </div>

                <div className={`rounded-lg border p-3 ${getActivityBgColor(activity.type)}`}>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex-shrink-0">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-800">
                          {getActivityTypeLabel(activity.type)}
                        </span>
                        <span className="text-xs text-gray-500 flex-shrink-0">
                          {timeAgoHe(activity.created_at)}
                        </span>
                      </div>
                      {activity.description && (
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{activity.description}</p>
                      )}
                      {activity.creator && (
                        <p className="mt-1 text-xs text-gray-500">
                          נוצר ע&quot;י {activity.creator.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
