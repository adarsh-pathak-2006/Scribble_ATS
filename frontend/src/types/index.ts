export interface User {
  id: number;
  username: string;
  email: string;
}

export interface Profile {
  id: number;
  nickname: string;
  profile_image: string | null;
  phone_number: string;
  bio?: string;
  user: User;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface Resume {
  id: number;
  slug: string;
  resumepdf: string;
  resumedata: string | null;
  created_on: string;
}

export interface ResumeScan {
  id: number;
  slug: string;
  job_description: string;
  ats_score: number | null;
  created_on: string;
  resume?: Resume;
}

export interface ResumeCreation {
  id: number;
  slug: string;
  generated_resume: string | null;
  created_on: string;
  scan?: {
    id: number;
    slug: string;
    ats_score: number | null;
  };
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}
