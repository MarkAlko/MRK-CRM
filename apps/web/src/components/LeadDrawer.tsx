'use client';

import React, { useState, useEffect, useCallback, Fragment } from 'react';
import { leadsApi, usersApi } from '@/lib/api';
import {
  PIPELINE_STATUSES,
  TEMPERATURE_OPTIONS,
  SOURCES,
  getStatusLabel,
  getStatusColor,
} from '@/lib/constants';
import { formatPhoneDisplay } from '@/lib/phone';
import type { Lead, LeadStatus, LeadTemperature, User } from '@/lib/types';
import ActivityTimeline from './ActivityTimeline';
import OffersList from './OffersList';

/* ──────────────────────────────────────────────
   Valid status transitions map
   ────────────────────────────────────────────── */

const VALID_TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  new_lead: ['initial_call_done', 'irrelevant'],
  initial_call_done: ['fit_for_meeting', 'irrelevant', 'lost'],
  fit_for_meeting: ['meeting_scheduled', 'irrelevant', 'lost'],
  meeting_scheduled: ['meeting_done', 'irrelevant', 'lost'],
  meeting_done: ['offer_sent', 'irrelevant', 'lost'],
  offer_sent: ['negotiation', 'won', 'lost'],
  negotiation: ['won', 'lost'],
  won: [],
  lost: ['new_lead'],
  irrelevant: ['new_lead'],
};

/* ──────────────────────────────────────────────
   Tabs
   ────────────────────────────────────────────── */

type TabKey = 'details' | 'bot' | 'activities' | 'offers';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'details', label: 'פרטים' },
  { key: 'bot', label: 'בוט' },
  { key: 'activities', label: 'פעילויות' },
  { key: 'offers', label: 'הצעות' },
];

/* ──────────────────────────────────────────────
   Bot field labels
   ────────────────────────────────────────────── */

const BOT_COMMON_FIELDS: { key: keyof Lead; label: string }[] = [
  { key: 'bot_track', label: 'מסלול בוט' },
  { key: 'bot_completed', label: 'בוט הושלם' },
  { key: 'start_timeline', label: 'ציר זמן' },
  { key: 'plans_status', label: 'מצב תכניות' },
  { key: 'permit_status', label: 'מצב היתר' },
  { key: 'building_type', label: 'סוג בניין' },
  { key: 'site_access', label: 'נגישות אתר' },
  { key: 'estimated_size_bucket', label: 'גודל משוער' },
  { key: 'is_occupied', label: 'מאוכלס' },
];

const BOT_MAMAD_FIELDS: { key: keyof Lead; label: string }[] = [
  { key: 'mamad_variant', label: 'סוג ממ"ד' },
];

const BOT_PRIVATE_FIELDS: { key: keyof Lead; label: string }[] = [
  { key: 'private_stage', label: 'שלב בנייה' },
  { key: 'private_special_struct', label: 'מבנה מיוחד' },
];

const BOT_ARCH_FIELDS: { key: keyof Lead; label: string }[] = [
  { key: 'arch_service', label: 'סוג שירות' },
  { key: 'arch_property_type', label: 'סוג נכס' },
  { key: 'arch_planning_stage', label: 'שלב תכנון' },
  { key: 'arch_existing_docs', label: 'מסמכים קיימים' },
];

const BOT_RENO_FIELDS: { key: keyof Lead; label: string }[] = [
  { key: 'reno_type', label: 'סוג שיפוץ' },
  { key: 'reno_has_plan', label: 'יש תכנית' },
];

/* ──────────────────────────────────────────────
   Props
   ────────────────────────────────────────────── */

interface LeadDrawerProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

/* ──────────────────────────────────────────────
   Component
   ────────────────────────────────────────────── */

export default function LeadDrawer({ lead, isOpen, onClose, onUpdate }: LeadDrawerProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('details');

  // Details form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [street, setStreet] = useState('');
  const [temperature, setTemperature] = useState<LeadTemperature | ''>('');

  // Closer assignment
  const [closers, setClosers] = useState<User[]>([]);
  const [selectedCloser, setSelectedCloser] = useState('');
  const [loadingClosers, setLoadingClosers] = useState(false);

  // Save state
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Status transition
  const [transitioning, setTransitioning] = useState(false);
  const [transitionError, setTransitionError] = useState<string | null>(null);

  // Closer assign
  const [assigningCloser, setAssigningCloser] = useState(false);

  /* ── Populate form when lead changes ─── */
  useEffect(() => {
    if (lead) {
      setFullName(lead.full_name || '');
      setPhone(lead.phone || '');
      setEmail(lead.email || '');
      setCity(lead.city || '');
      setStreet(lead.street || '');
      setTemperature(lead.temperature || '');
      setSelectedCloser(lead.closer_id || '');
      setSaveError(null);
      setSaveSuccess(false);
      setTransitionError(null);
    }
  }, [lead]);

  /* ── Reset tab when drawer opens ─── */
  useEffect(() => {
    if (isOpen) {
      setActiveTab('details');
    }
  }, [isOpen]);

  /* ── Fetch closers ─── */
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    setLoadingClosers(true);

    usersApi
      .list()
      .then((users) => {
        if (!cancelled) {
          setClosers(users.filter((u) => u.role === 'closer' && u.is_active));
        }
      })
      .catch(() => {
        // Silently fail – closers dropdown will be empty
      })
      .finally(() => {
        if (!cancelled) setLoadingClosers(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  /* ── Save details ─── */
  const handleSave = async () => {
    if (!lead) return;
    setSaveError(null);
    setSaveSuccess(false);

    try {
      setSaving(true);
      await leadsApi.update(lead.id, {
        full_name: fullName,
        phone,
        email: email || null,
        city: city || null,
        street: street || null,
        temperature: temperature || null,
      });
      setSaveSuccess(true);
      onUpdate();
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      setSaveError('שגיאה בשמירת הפרטים');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  /* ── Status transition ─── */
  const handleTransition = async (newStatus: LeadStatus) => {
    if (!lead) return;
    setTransitionError(null);

    try {
      setTransitioning(true);
      await leadsApi.transition(lead.id, newStatus);
      onUpdate();
    } catch (err) {
      setTransitionError('שגיאה בשינוי הסטטוס');
      console.error(err);
    } finally {
      setTransitioning(false);
    }
  };

  /* ── Assign closer ─── */
  const handleAssignCloser = async () => {
    if (!lead || !selectedCloser) return;

    try {
      setAssigningCloser(true);
      await leadsApi.assignCloser(lead.id, selectedCloser);
      onUpdate();
    } catch (err) {
      setSaveError('שגיאה בשיוך סוגר');
      console.error(err);
    } finally {
      setAssigningCloser(false);
    }
  };

  /* ── Get valid next statuses ─── */
  const getNextStatuses = useCallback((): LeadStatus[] => {
    if (!lead) return [];
    return VALID_TRANSITIONS[lead.status] || [];
  }, [lead]);

  /* ── Get source label ─── */
  const getSourceLabelForLead = (): string => {
    if (!lead) return '';
    return SOURCES.find((s) => s.key === lead.source)?.label ?? lead.source;
  };

  /* ── Format bot field value for display ─── */
  const formatBotValue = (value: unknown): string => {
    if (value === null || value === undefined) return '---';
    if (typeof value === 'boolean') return value ? 'כן' : 'לא';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  /* ── Get track-specific fields ─── */
  const getTrackFields = (): { key: keyof Lead; label: string }[] => {
    if (!lead?.bot_track) return [];
    switch (lead.bot_track) {
      case 'mamad':
        return BOT_MAMAD_FIELDS;
      case 'private_home':
        return BOT_PRIVATE_FIELDS;
      case 'architecture':
        return BOT_ARCH_FIELDS;
      case 'renovation':
        return BOT_RENO_FIELDS;
      default:
        return [];
    }
  };

  /* ── Render ─── */
  if (!isOpen || !lead) return null;

  return (
    <Fragment>
      {/* ── Overlay ─────────────────────────── */}
      <div
        className="fixed inset-0 z-40 bg-black/40 transition-opacity"
        onClick={onClose}
      />

      {/* ── Drawer panel (slides from LEFT for RTL) ─── */}
      <div
        dir="rtl"
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg transform flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out"
      >
        {/* ── Header ─── */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{lead.full_name}</h2>
            <p className="text-sm text-gray-500">{formatPhoneDisplay(lead.phone)}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Tabs ─── */}
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px px-6" aria-label="Tabs">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* ── Tab content ─── */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* ════════════════════════════════════
             Details Tab
             ════════════════════════════════════ */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* ── Editable fields ─── */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">שם מלא</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">טלפון</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    dir="ltr"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-left focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">אימייל</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    dir="ltr"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-left focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">עיר</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">רחוב</label>
                    <input
                      type="text"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">טמפרטורה</label>
                  <select
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value as LeadTemperature | '')}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">בחר טמפרטורה</option>
                    {TEMPERATURE_OPTIONS.map((t) => (
                      <option key={t.key} value={t.key}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">מקור</label>
                  <p className="rounded-md bg-gray-50 border border-gray-200 px-3 py-2 text-sm text-gray-600">
                    {getSourceLabelForLead()}
                  </p>
                </div>
              </div>

              {/* ── Save button ─── */}
              {saveError && <p className="text-sm text-red-600">{saveError}</p>}
              {saveSuccess && <p className="text-sm text-green-600">הפרטים נשמרו בהצלחה</p>}

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'שומר...' : 'שמור'}
              </button>

              {/* ── Status section ─── */}
              <div className="border-t border-gray-200 pt-4 space-y-3">
                <h3 className="text-sm font-semibold text-gray-700">סטטוס</h3>
                <div>
                  <span className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(lead.status)}`}>
                    {getStatusLabel(lead.status)}
                  </span>
                </div>

                {getNextStatuses().length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">שנה סטטוס ל:</p>
                    <div className="flex flex-wrap gap-2">
                      {getNextStatuses().map((nextStatus) => (
                        <button
                          key={nextStatus}
                          onClick={() => handleTransition(nextStatus)}
                          disabled={transitioning}
                          className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-sm ${getStatusColor(nextStatus)}`}
                        >
                          {getStatusLabel(nextStatus)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {transitionError && (
                  <p className="text-sm text-red-600">{transitionError}</p>
                )}
              </div>

              {/* ── Assign closer ─── */}
              <div className="border-t border-gray-200 pt-4 space-y-3">
                <h3 className="text-sm font-semibold text-gray-700">שיוך סוגר</h3>

                {lead.closer && (
                  <p className="text-sm text-gray-600">
                    סוגר נוכחי: <span className="font-medium">{lead.closer.name}</span>
                  </p>
                )}

                <div className="flex gap-2">
                  <select
                    value={selectedCloser}
                    onChange={(e) => setSelectedCloser(e.target.value)}
                    disabled={loadingClosers}
                    className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <option value="">
                      {loadingClosers ? 'טוען...' : 'בחר סוגר'}
                    </option>
                    {closers.map((closer) => (
                      <option key={closer.id} value={closer.id}>
                        {closer.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleAssignCloser}
                    disabled={!selectedCloser || assigningCloser}
                    className="rounded-md bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {assigningCloser ? 'משייך...' : 'שייך'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════
             Bot Tab
             ════════════════════════════════════ */}
          {activeTab === 'bot' && (
            <div className="space-y-6">
              {/* ── Structured bot data ─── */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">נתוני בוט (מובנה)</h3>
                <div className="rounded-lg border border-gray-200 bg-gray-50 divide-y divide-gray-200">
                  {BOT_COMMON_FIELDS.map((field) => (
                    <div key={field.key} className="flex items-start px-4 py-2.5">
                      <span className="text-sm font-medium text-gray-600 w-32 flex-shrink-0">
                        {field.label}
                      </span>
                      <span className="text-sm text-gray-800 flex-1">
                        {formatBotValue(lead[field.key])}
                      </span>
                    </div>
                  ))}

                  {/* Track-specific fields */}
                  {getTrackFields().length > 0 && (
                    <>
                      <div className="px-4 py-2 bg-gray-100">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          שדות ייחודיים למסלול
                        </span>
                      </div>
                      {getTrackFields().map((field) => (
                        <div key={field.key} className="flex items-start px-4 py-2.5">
                          <span className="text-sm font-medium text-gray-600 w-32 flex-shrink-0">
                            {field.label}
                          </span>
                          <span className="text-sm text-gray-800 flex-1">
                            {formatBotValue(lead[field.key])}
                          </span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>

              {/* ── Raw bot payload ─── */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">נתוני בוט (גולמי)</h3>
                {lead.bot_payload ? (
                  <pre
                    dir="ltr"
                    className="rounded-lg border border-gray-200 bg-gray-900 p-4 text-xs text-green-400 overflow-x-auto max-h-96 overflow-y-auto whitespace-pre-wrap"
                  >
                    {JSON.stringify(lead.bot_payload, null, 2)}
                  </pre>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-6 bg-gray-50 rounded-lg border border-gray-200">
                    אין נתוני בוט גולמיים
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ════════════════════════════════════
             Activities Tab
             ════════════════════════════════════ */}
          {activeTab === 'activities' && (
            <ActivityTimeline leadId={lead.id} />
          )}

          {/* ════════════════════════════════════
             Offers Tab
             ════════════════════════════════════ */}
          {activeTab === 'offers' && (
            <OffersList leadId={lead.id} />
          )}
        </div>
      </div>
    </Fragment>
  );
}
