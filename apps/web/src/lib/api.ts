import type {
  User,
  Lead,
  Activity,
  Offer,
  CampaignMapping,
  LoginRequest,
  LoginResponse,
  UserCreateRequest,
  UserUpdateRequest,
  LeadUpdateRequest,
  LeadFilters,
  PaginatedResponse,
  ActivityCreateRequest,
  OfferCreateRequest,
  CampaignMappingCreateRequest,
  CampaignMappingUpdateRequest,
  DashboardStats,
  LeadStatus,
} from './types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/* ──────────────────────────────────────────────
   Core fetch wrapper
   ────────────────────────────────────────────── */

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function attemptRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const config: RequestInit = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> | undefined),
    },
    ...options,
  };

  // Don't set Content-Type for FormData (let the browser set boundary)
  if (options.body instanceof FormData) {
    const headers = { ...(options.headers as Record<string, string> | undefined) };
    delete headers['Content-Type'];
    config.headers = headers;
  }

  let res = await fetch(url, config);

  // Handle 401 – attempt token refresh once
  if (res.status === 401) {
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = attemptRefresh();
    }

    const refreshed = await refreshPromise;
    isRefreshing = false;
    refreshPromise = null;

    if (refreshed) {
      res = await fetch(url, config);
    } else {
      // Redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new ApiError('לא מורשה – יש להתחבר מחדש', 401);
    }
  }

  if (!res.ok) {
    let message = 'שגיאה בשרת';
    try {
      const body = await res.json();
      message = body.detail || body.message || message;
    } catch {
      // keep default message
    }
    throw new ApiError(message, res.status);
  }

  // Handle 204 No Content
  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}

/* ──────────────────────────────────────────────
   Auth
   ────────────────────────────────────────────── */

export const authApi = {
  login(data: LoginRequest): Promise<LoginResponse> {
    return request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  logout(): Promise<void> {
    return request<void>('/auth/logout', { method: 'POST' });
  },

  refresh(): Promise<LoginResponse> {
    return request<LoginResponse>('/auth/refresh', { method: 'POST' });
  },

  me(): Promise<User> {
    return request<User>('/auth/me');
  },
};

/* ──────────────────────────────────────────────
   Users
   ────────────────────────────────────────────── */

export const usersApi = {
  list(): Promise<User[]> {
    return request<User[]>('/users');
  },

  get(id: string): Promise<User> {
    return request<User>(`/users/${id}`);
  },

  create(data: UserCreateRequest): Promise<User> {
    return request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update(id: string, data: UserUpdateRequest): Promise<User> {
    return request<User>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};

/* ──────────────────────────────────────────────
   Leads
   ────────────────────────────────────────────── */

function buildLeadQuery(filters: LeadFilters): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const leadsApi = {
  list(filters: LeadFilters = {}): Promise<PaginatedResponse<Lead>> {
    return request<PaginatedResponse<Lead>>(`/leads${buildLeadQuery(filters)}`);
  },

  get(id: string): Promise<Lead> {
    return request<Lead>(`/leads/${id}`);
  },

  update(id: string, data: LeadUpdateRequest): Promise<Lead> {
    return request<Lead>(`/leads/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  transition(id: string, newStatus: LeadStatus): Promise<Lead> {
    return request<Lead>(`/leads/${id}/transition`, {
      method: 'POST',
      body: JSON.stringify({ to_status: newStatus }),
    });
  },

  create(data: { project_type_id: number; full_name: string; phone: string; email?: string; source?: string; city?: string; street?: string; temperature?: string }): Promise<Lead> {
    return request<Lead>('/leads', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  assignCloser(id: string, closerId: string): Promise<Lead> {
    return request<Lead>(`/leads/${id}/assign-closer`, {
      method: 'POST',
      body: JSON.stringify({ closer_id: closerId }),
    });
  },
};

/* ──────────────────────────────────────────────
   Activities
   ────────────────────────────────────────────── */

export const activitiesApi = {
  listByLead(leadId: string): Promise<Activity[]> {
    return request<Activity[]>(`/leads/${leadId}/activities`);
  },

  create(data: ActivityCreateRequest): Promise<Activity> {
    return request<Activity>(`/leads/${data.lead_id}/activities`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

/* ──────────────────────────────────────────────
   Offers
   ────────────────────────────────────────────── */

export const offersApi = {
  listByLead(leadId: string): Promise<Offer[]> {
    return request<Offer[]>(`/leads/${leadId}/offers`);
  },

  create(leadId: string, formData: FormData): Promise<Offer> {
    return request<Offer>(`/leads/${leadId}/offers`, {
      method: 'POST',
      body: formData,
    });
  },

  download(offerId: string): string {
    return `${BASE_URL}/offers/${offerId}/download`;
  },
};

/* ──────────────────────────────────────────────
   Campaign Mappings
   ────────────────────────────────────────────── */

export const campaignMappingsApi = {
  list(): Promise<CampaignMapping[]> {
    return request<CampaignMapping[]>('/campaign-mappings');
  },

  create(data: CampaignMappingCreateRequest): Promise<CampaignMapping> {
    return request<CampaignMapping>('/campaign-mappings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update(id: string, data: CampaignMappingUpdateRequest): Promise<CampaignMapping> {
    return request<CampaignMapping>(`/campaign-mappings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete(id: string): Promise<void> {
    return request<void>(`/campaign-mappings/${id}`, { method: 'DELETE' });
  },
};

/* ──────────────────────────────────────────────
   Dashboard
   ────────────────────────────────────────────── */

export const dashboardApi = {
  stats(): Promise<DashboardStats> {
    return request<DashboardStats>('/leads/dashboard/stats');
  },
};
