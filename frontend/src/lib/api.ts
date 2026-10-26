import { AuthTokens, Profile, Resume, ResumeScan, ResumeCreation, PaginatedResponse } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

class APIClient {
  private getTokens(): AuthTokens | null {
    if (typeof window === 'undefined') return null;
    const access = localStorage.getItem('access_token');
    const refresh = localStorage.getItem('refresh_token');
    return access && refresh ? { access, refresh } : null;
  }

  public setTokens(tokens: AuthTokens) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);
  }

  public clearTokens() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  private async refreshAccessToken(): Promise<string | null> {
    const tokens = this.getTokens();
    if (!tokens?.refresh) return null;

    try {
      const res = await fetch(`${API_BASE_URL}/accounts/api/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: tokens.refresh }),
      });

      if (!res.ok) {
        this.clearTokens();
        return null;
      }

      const data = await res.json();
      if (data.access) {
        localStorage.setItem('access_token', data.access);
        return data.access;
      }
      return null;
    } catch {
      this.clearTokens();
      return null;
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    requiresAuth: boolean = true
  ): Promise<T> {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (requiresAuth) {
      const tokens = this.getTokens();
      if (tokens?.access) {
        headers['Authorization'] = `Bearer ${tokens.access}`;
      }
    }

    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    let response = await fetch(url, {
      ...options,
      headers,
    });

    // If 401 Unauthorized and auth was required, attempt token refresh once
    if (response.status === 401 && requiresAuth) {
      const newAccess = await this.refreshAccessToken();
      if (newAccess) {
        headers['Authorization'] = `Bearer ${newAccess}`;
        response = await fetch(url, {
          ...options,
          headers,
        });
      }
    }

    // Handle responses
    if (!response.ok) {
      let errorMessage = 'An error occurred';
      try {
        const errorData = await response.json();
        if (typeof errorData === 'object' && errorData !== null) {
          if ('message' in errorData) errorMessage = errorData.message;
          else if ('detail' in errorData) errorMessage = errorData.detail;
          else {
            const firstKey = Object.keys(errorData)[0];
            const val = (errorData as Record<string, unknown>)[firstKey];
            errorMessage = Array.isArray(val) ? `${firstKey}: ${val[0]}` : String(val);
          }
        }
      } catch {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    // 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  // Auth Endpoints
  public async register(payload: {
    username: string;
    email: string;
    first_name?: string;
    last_name?: string;
    phone_number?: string;
  }): Promise<{ message: string; session_id: string; debug_otp?: string }> {
    return this.request('/accounts/register/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }, false);
  }

  public async verifyOtp(sessionId: string, otp: string): Promise<{ message: string }> {
    return this.request(`/accounts/otp-verify/${sessionId}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ otp }),
    }, false);
  }

  public async setPassword(sessionId: string, password: string): Promise<{ message: string }> {
    return this.request(`/accounts/password-set/${sessionId}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    }, false);
  }

  public async login(payload: { username: string; password: string }): Promise<AuthTokens> {
    const res = await this.request<AuthTokens>('/accounts/api/token-obtain/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }, false);
    this.setTokens(res);
    return res;
  }

  public async getProfile(): Promise<Profile> {
    return this.request<Profile>('/accounts/profile/');
  }

  // Resume Endpoints
  public async getResumes(page: number = 1): Promise<PaginatedResponse<Resume>> {
    return this.request<PaginatedResponse<Resume>>(`/resume/?page=${page}`);
  }

  public async uploadResume(file: File): Promise<Resume> {
    const formData = new FormData();
    formData.append('resumepdf', file);

    const tokens = this.getTokens();
    const headers: Record<string, string> = {};
    if (tokens?.access) {
      headers['Authorization'] = `Bearer ${tokens.access}`;
    }

    const res = await fetch(`${API_BASE_URL}/resume/`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!res.ok) {
      let msg = 'Failed to upload resume';
      try {
        const err = await res.json();
        msg = err.message || JSON.stringify(err);
      } catch {}
      throw new Error(msg);
    }

    return res.json();
  }

  // Scan Endpoints
  public async getScans(resumeSlug: string, page: number = 1): Promise<PaginatedResponse<ResumeScan>> {
    return this.request<PaginatedResponse<ResumeScan>>(`/resume/${resumeSlug}/scan/?page=${page}`);
  }

  public async createScan(resumeSlug: string, jobDescription: string): Promise<{ message: string; task_id?: string }> {
    return this.request(`/resume/${resumeSlug}/scan/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_description: jobDescription }),
    });
  }

  public async getScanDetail(resumeSlug: string, scanSlug: string): Promise<ResumeScan> {
    return this.request<ResumeScan>(`/resume/${resumeSlug}/scan/${scanSlug}/`);
  }

  public async triggerAtsResumeOptimization(scanSlug: string): Promise<{ message: string; task_id?: string }> {
    return this.request(`/resume/ats-resume/${scanSlug}/`, {
      method: 'POST',
    });
  }

  // Created / Optimized Resumes Endpoints
  public async getCreatedResumes(page: number = 1): Promise<PaginatedResponse<ResumeCreation>> {
    return this.request<PaginatedResponse<ResumeCreation>>(`/resume/created/?page=${page}`);
  }

  public async getCreatedResumeDetail(slug: string): Promise<ResumeCreation> {
    return this.request<ResumeCreation>(`/resume/created/${slug}/`);
  }
}

export const api = new APIClient();
