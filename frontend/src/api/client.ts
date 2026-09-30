const BASE_URL = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('algo_token');
}

export function setAuthToken(token: string): void {
  localStorage.setItem('algo_token', token);
}

export function removeAuthToken(): void {
  localStorage.removeItem('algo_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }

  return data as T;
}

export const api = {
  // Auth
  login: (credentials: { username: string; password: string }) =>
    request<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  register: (userData: { username: string; email: string; password: string }) =>
    request<{ user: any; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  getMe: () => request<{ user: any }>('/auth/me'),

  // Problems
  getProblems: (params?: { difficulty?: string; tag?: string; status?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.difficulty) query.append('difficulty', params.difficulty);
    if (params?.tag) query.append('tag', params.tag);
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    return request<{ problems: any[] }>(`/problems?${query.toString()}`);
  },

  getProblemBySlug: (slug: string) => request<{ problem: any }>(`/problems/${slug}`),

  runCode: (slug: string, body: { language: string; code: string; customInput?: string }) =>
    request<{ result: any }>(`/problems/${slug}/run`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  submitCode: (slug: string, body: { language: string; code: string }) =>
    request<{
      submissionId: string;
      verdict: string;
      passedCount: number;
      totalCount: number;
      executionTimeMs: number;
      memoryUsedKb: number;
      compileError?: string;
      testCaseResults: any[];
    }>(`/problems/${slug}/submit`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  // User
  getUserProgress: () => request<{ stats: any }>('/user/progress'),

  // Submissions
  getSubmissions: (params?: { problemId?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.problemId) query.append('problemId', params.problemId);
    if (params?.limit) query.append('limit', String(params.limit));
    return request<{ submissions: any[] }>(`/submissions?${query.toString()}`);
  },

  getSubmissionById: (id: string) => request<{ submission: any }>(`/submissions/${id}`),

  // Admin
  getAdminProblems: () => request<{ problems: any[] }>('/admin/problems'),

  createProblem: (data: any) =>
    request<{ problem: any; generation: any }>('/admin/problems', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateProblem: (id: string, data: any) =>
    request<{ message: string }>(`/admin/problems/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteProblem: (id: string) =>
    request<{ message: string }>(`/admin/problems/${id}`, {
      method: 'DELETE',
    }),

  generateTestCases: (id: string) =>
    request<{ message: string; testCases: any[] }>(`/admin/problems/${id}/generate-tests`, {
      method: 'POST',
    }),

  getProblemTestCases: (id: string) =>
    request<{ testCases: any[] }>(`/admin/problems/${id}/test-cases`),

  toggleTestCaseVisibility: (testCaseId: string) =>
    request<{ is_hidden: number }>(`/admin/test-cases/${testCaseId}/toggle`, {
      method: 'PATCH',
    }),

  getAdminStats: () => request<any>('/admin/stats'),
};
