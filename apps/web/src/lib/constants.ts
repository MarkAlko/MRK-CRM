import type { LeadStatus, LeadTemperature, LeadSource, ActivityType, OfferStatus } from './types';

/* ──────────────────────────────────────────────
   Pipeline statuses
   ────────────────────────────────────────────── */

export interface PipelineStatus {
  key: LeadStatus;
  label: string;
  color: string;
}

export const PIPELINE_STATUSES: PipelineStatus[] = [
  { key: 'new_lead', label: 'ליד חדש', color: 'bg-blue-100 text-blue-800' },
  { key: 'initial_call_done', label: 'בוצעה שיחה ראשונית', color: 'bg-indigo-100 text-indigo-800' },
  { key: 'fit_for_meeting', label: 'מתאים לפגישה', color: 'bg-purple-100 text-purple-800' },
  { key: 'meeting_scheduled', label: 'פגישה נקבעה', color: 'bg-yellow-100 text-yellow-800' },
  { key: 'meeting_done', label: 'פגישה בוצעה', color: 'bg-orange-100 text-orange-800' },
  { key: 'offer_sent', label: 'הצעת מחיר', color: 'bg-pink-100 text-pink-800' },
  { key: 'negotiation', label: 'מו"מ', color: 'bg-red-100 text-red-800' },
  { key: 'won', label: 'נסגר \u2013 זכינו', color: 'bg-green-100 text-green-800' },
  { key: 'lost', label: 'נסגר \u2013 הפסדנו', color: 'bg-gray-100 text-gray-800' },
  { key: 'irrelevant', label: 'לא רלוונטי', color: 'bg-gray-100 text-gray-500' },
];

export const ACTIVE_PIPELINE_STATUSES: PipelineStatus[] = PIPELINE_STATUSES.filter(
  (s) => !['won', 'lost', 'irrelevant'].includes(s.key),
);

export const CLOSED_PIPELINE_STATUSES: PipelineStatus[] = PIPELINE_STATUSES.filter(
  (s) => ['won', 'lost', 'irrelevant'].includes(s.key),
);

/* ──────────────────────────────────────────────
   Project types
   ────────────────────────────────────────────── */

export interface ProjectTypeOption {
  key: string;
  label: string;
  path: string;
}

export const PROJECT_TYPES: ProjectTypeOption[] = [
  { key: 'mamad', label: 'ממ״ד', path: 'mamad' },
  { key: 'private_home', label: 'בנייה פרטית', path: 'private-home' },
  { key: 'renovation', label: 'עבודות גמר', path: 'renovation' },
  { key: 'architecture', label: 'אדריכלות / רישוי / עיצוב פנים', path: 'architecture' },
];

/* ──────────────────────────────────────────────
   Temperature options
   ────────────────────────────────────────────── */

export interface TemperatureOption {
  key: LeadTemperature;
  label: string;
  color: string;
}

export const TEMPERATURE_OPTIONS: TemperatureOption[] = [
  { key: 'hot', label: 'חם', color: 'text-red-600' },
  { key: 'warm', label: 'חמים', color: 'text-orange-500' },
  { key: 'cold', label: 'קר', color: 'text-blue-500' },
];

/* ──────────────────────────────────────────────
   Lead sources
   ────────────────────────────────────────────── */

export interface SourceOption {
  key: LeadSource;
  label: string;
}

export const SOURCES: SourceOption[] = [
  { key: 'meta_form', label: 'טופס מטא' },
  { key: 'landing_page', label: 'דף נחיתה' },
  { key: 'manual', label: 'ידני' },
];

/* ──────────────────────────────────────────────
   Activity types
   ────────────────────────────────────────────── */

export interface ActivityTypeOption {
  key: ActivityType;
  label: string;
  icon: string;
}

export const ACTIVITY_TYPES: ActivityTypeOption[] = [
  { key: 'call', label: 'שיחה', icon: '\u260E' },
  { key: 'meeting', label: 'פגישה', icon: '\uD83D\uDCC5' },
  { key: 'note', label: 'הערה', icon: '\uD83D\uDCDD' },
  { key: 'offer_sent', label: 'שליחת הצעה', icon: '\uD83D\uDCE9' },
];

/* ──────────────────────────────────────────────
   Offer statuses
   ────────────────────────────────────────────── */

export interface OfferStatusOption {
  key: OfferStatus;
  label: string;
  color: string;
}

export const OFFER_STATUSES: OfferStatusOption[] = [
  { key: 'draft', label: 'טיוטה', color: 'bg-gray-100 text-gray-700' },
  { key: 'sent', label: 'נשלח', color: 'bg-blue-100 text-blue-700' },
  { key: 'negotiation', label: 'מו"מ', color: 'bg-yellow-100 text-yellow-700' },
  { key: 'approved', label: 'אושר', color: 'bg-green-100 text-green-700' },
  { key: 'rejected', label: 'נדחה', color: 'bg-red-100 text-red-700' },
];

/* ──────────────────────────────────────────────
   User roles
   ────────────────────────────────────────────── */

export const USER_ROLES: { key: string; label: string }[] = [
  { key: 'admin', label: 'מנהל' },
  { key: 'qualifier', label: 'מוקדן' },
  { key: 'closer', label: 'סוגר' },
];

/* ──────────────────────────────────────────────
   Status label helper
   ────────────────────────────────────────────── */

export function getStatusLabel(key: string): string {
  return PIPELINE_STATUSES.find((s) => s.key === key)?.label ?? key;
}

export function getStatusColor(key: string): string {
  return PIPELINE_STATUSES.find((s) => s.key === key)?.color ?? 'bg-gray-100 text-gray-700';
}

export function getTemperatureLabel(key: string): string {
  return TEMPERATURE_OPTIONS.find((t) => t.key === key)?.label ?? key;
}

export function getTemperatureColor(key: string): string {
  return TEMPERATURE_OPTIONS.find((t) => t.key === key)?.color ?? 'text-gray-500';
}

export function getSourceLabel(key: string): string {
  return SOURCES.find((s) => s.key === key)?.label ?? key;
}

export function getActivityTypeLabel(key: string): string {
  return ACTIVITY_TYPES.find((a) => a.key === key)?.label ?? key;
}

export function getOfferStatusLabel(key: string): string {
  return OFFER_STATUSES.find((o) => o.key === key)?.label ?? key;
}

export function getOfferStatusColor(key: string): string {
  return OFFER_STATUSES.find((o) => o.key === key)?.color ?? 'bg-gray-100 text-gray-700';
}

export function getProjectTypeByPath(path: string): ProjectTypeOption | undefined {
  return PROJECT_TYPES.find((p) => p.path === path);
}

export function getProjectTypeByKey(key: string): ProjectTypeOption | undefined {
  return PROJECT_TYPES.find((p) => p.key === key);
}
