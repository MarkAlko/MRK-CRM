/* ──────────────────────────────────────────────
   MRK CRM – Shared TypeScript types
   ────────────────────────────────────────────── */

// ── Enums ──────────────────────────────────────

export type UserRole = 'admin' | 'qualifier' | 'closer';

export type LeadSource = 'meta_form' | 'landing_page' | 'manual';

export type LeadTemperature = 'hot' | 'warm' | 'cold';

export type LeadStatus =
  | 'new_lead'
  | 'initial_call_done'
  | 'fit_for_meeting'
  | 'meeting_scheduled'
  | 'meeting_done'
  | 'offer_sent'
  | 'negotiation'
  | 'won'
  | 'lost'
  | 'irrelevant';

export type ActivityType = 'call' | 'meeting' | 'note' | 'offer_sent';

export type OfferStatus = 'draft' | 'sent' | 'negotiation' | 'approved' | 'rejected';

// ── Models ─────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface ProjectType {
  id: number;
  key: string;
  display_name_he: string;
  is_active: boolean;
}

export interface Lead {
  id: string;
  project_type_id: number;
  full_name: string;
  phone: string;
  normalized_phone: string;
  email: string | null;
  source: LeadSource;
  campaign_name: string | null;
  adset_name: string | null;
  ad_name: string | null;
  city: string | null;
  street: string | null;
  temperature: LeadTemperature | null;
  status: LeadStatus;
  qualifier_id: string | null;
  closer_id: string | null;

  // Bot fields
  bot_payload: Record<string, unknown> | null;
  bot_track: string | null;
  bot_completed: boolean;

  // Common qualification fields
  start_timeline: string | null;
  plans_status: string | null;
  permit_status: string | null;
  building_type: string | null;
  site_access: string | null;
  estimated_size_bucket: string | null;
  is_occupied: string | null;

  // Mamad-specific
  mamad_variant: string | null;

  // Private home-specific
  private_stage: string | null;
  private_special_struct: Record<string, unknown> | null;

  // Architecture-specific
  arch_service: string | null;
  arch_property_type: string | null;
  arch_planning_stage: string | null;
  arch_existing_docs: Record<string, unknown> | null;

  // Renovation-specific
  reno_type: string | null;
  reno_has_plan: string | null;

  created_at: string;
  updated_at: string;

  // Relationships (populated by API)
  project_type?: ProjectType;
  qualifier?: User | null;
  closer?: User | null;
  activities?: Activity[];
  offers?: Offer[];
  status_history?: LeadStatusHistory[];
}

export interface Activity {
  id: string;
  lead_id: string;
  type: ActivityType;
  description: string | null;
  created_by: string;
  created_at: string;
  creator?: User;
}

export interface Offer {
  id: string;
  lead_id: string;
  file_path: string;
  amount_estimated: number | null;
  status: OfferStatus;
  created_at: string;
  updated_at: string;
}

export interface LeadStatusHistory {
  id: number;
  lead_id: string;
  from_status: string | null;
  to_status: string;
  changed_by: string;
  changed_at: string;
  changed_by_user?: User;
}

export interface CampaignMapping {
  id: string;
  contains_text: string;
  project_type_key: string;
  priority: number;
  is_active: boolean;
  created_at: string;
}

// ── API request / response shapes ──────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface UserCreateRequest {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface UserUpdateRequest {
  name?: string;
  email?: string;
  role?: UserRole;
  is_active?: boolean;
  password?: string;
}

export interface LeadUpdateRequest {
  full_name?: string;
  phone?: string;
  email?: string | null;
  source?: LeadSource;
  campaign_name?: string | null;
  adset_name?: string | null;
  ad_name?: string | null;
  city?: string | null;
  street?: string | null;
  temperature?: LeadTemperature | null;
  status?: LeadStatus;
  qualifier_id?: string | null;
  closer_id?: string | null;
  bot_completed?: boolean;
  start_timeline?: string | null;
  plans_status?: string | null;
  permit_status?: string | null;
  building_type?: string | null;
  site_access?: string | null;
  estimated_size_bucket?: string | null;
  is_occupied?: string | null;
  mamad_variant?: string | null;
  private_stage?: string | null;
  private_special_struct?: Record<string, unknown> | null;
  arch_service?: string | null;
  arch_property_type?: string | null;
  arch_planning_stage?: string | null;
  arch_existing_docs?: Record<string, unknown> | null;
  reno_type?: string | null;
  reno_has_plan?: string | null;
}

export interface LeadFilters {
  project_type_key?: string;
  status?: LeadStatus;
  temperature?: LeadTemperature;
  source?: LeadSource;
  closer_id?: string;
  qualifier_id?: string;
  bot_completed?: boolean;
  plans_status?: string;
  permit_status?: string;
  site_access?: string;
  start_timeline?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface ActivityCreateRequest {
  lead_id: string;
  type: ActivityType;
  description?: string;
}

export interface OfferCreateRequest {
  lead_id: string;
  amount_estimated?: number;
  status?: OfferStatus;
}

export interface CampaignMappingCreateRequest {
  contains_text: string;
  project_type_key: string;
  priority?: number;
}

export interface CampaignMappingUpdateRequest {
  contains_text?: string;
  project_type_key?: string;
  priority?: number;
  is_active?: boolean;
}

export interface DashboardStats {
  leads_this_month: number;
  wins_this_month: number;
  conversion_rate: number;
  leads_by_source: { source: string; count: number }[];
  leads_by_project_type: { project_type: string; count: number }[];
}
