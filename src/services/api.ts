const BASE_URL = 'http://localhost:8080/api';

interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  timestamp?: string;
}

class ApiError extends Error {
  status: number;
  data: Record<string, string> | null;

  constructor(message: string, status: number, data: Record<string, string> | null = null) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'ApiError';
  }
}

function getToken(): string | null {
  return localStorage.getItem('ribbion_token');
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // DELETE returns 200 with message
  if (response.status === 204) {
    return {} as T;
  }

  const json: ApiResponse<T> = await response.json();

  if (!response.ok || !json.success) {
    throw new ApiError(
      json.message || 'Something went wrong',
      response.status,
      json.data as Record<string,string> | null
    );
  }

  return json.data as T;
}

// ====================
// Auth
// ====================
export interface AuthUser {
  id: number;
  username: string;
  email: string;
  displayName: string;
  reputation: number;
  role: string;
  createdAt: string;
}

export interface AuthData {
  accessToken: string;
  tokenType: string;
  user: AuthUser;
}

export const authApi = {
  register: (data: { username: string; email: string; password: string; displayName?: string }) =>
    request<AuthData>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  login: (data: { usernameOrEmail: string; password: string }) =>
    request<AuthData>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
};

// ====================
// Users
// ====================
export interface UserProfile {
  id: number;
  username: string;
  email?: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  reputation: number;
  role: string;
  createdAt: string;
}

export const usersApi = {
  getMe: () => request<UserProfile>('/users/me'),
  updateMe: (data: { displayName?: string; avatarUrl?: string; bio?: string }) =>
    request<UserProfile>('/users/me', { method: 'PUT', body: JSON.stringify(data) }),
  getUser: (id: number) => request<UserProfile>(`/users/${id}`),
  getUserQuestions: (id: number, page = 0, size = 10) =>
    request<PagedData<QuestionSummary>>(`/users/${id}/questions?page=${page}&size=${size}`),
  getUserAnswers: (id: number, page = 0, size = 10) =>
    request<PagedData<AnswerData>>(`/users/${id}/answers?page=${page}&size=${size}`),
};

// ====================
// Questions
// ====================
export interface UserSummary {
  id: number;
  username: string;
  displayName?: string;
  reputation: number;
  avatarUrl?: string | null;
}

export interface TagData {
  id: number;
  name: string;
  description?: string | null;
  questionCount?: number;
}

export interface QuestionSummary {
  id: number;
  title: string;
  author: UserSummary;
  tags: TagData[];
  voteCount: number;
  viewCount: number;
  answerCount: number;
  status: 'OPEN' | 'SOLVED';
  createdAt: string;
}

export interface QuestionDetail extends QuestionSummary {
  body: string;
}

export interface PagedData<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export const questionsApi = {
  list: (sort = 'NEWEST', page = 0, size = 10) =>
    request<PagedData<QuestionSummary>>(`/questions?sort=${sort}&page=${page}&size=${size}`),

  get: (id: number) => request<QuestionDetail>(`/questions/${id}`),

  create: (data: { title: string; body: string; tagNames?: string[] }) =>
    request<QuestionDetail>('/questions', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: number, data: { title: string; body: string; tagNames?: string[] }) =>
    request<QuestionDetail>(`/questions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: number) =>
    request<void>(`/questions/${id}`, { method: 'DELETE' }),

  search: (q: string, page = 0, size = 10) =>
    request<PagedData<QuestionSummary>>(`/questions/search?q=${encodeURIComponent(q)}&page=${page}&size=${size}`),

  byTag: (tag: string, page = 0, size = 10) =>
    request<PagedData<QuestionSummary>>(`/questions/tagged/${encodeURIComponent(tag)}?page=${page}&size=${size}`),
};

// ====================
// Answers
// ====================
export interface AnswerData {
  id: number;
  body: string;
  questionId: number;
  author: UserSummary;
  voteCount: number;
  accepted: boolean;
  createdAt: string;
}

export const answersApi = {
  list: (questionId: number, page = 0, size = 20) =>
    request<PagedData<AnswerData>>(`/questions/${questionId}/answers?page=${page}&size=${size}`),

  create: (questionId: number, body: string) =>
    request<AnswerData>(`/questions/${questionId}/answers`, { method: 'POST', body: JSON.stringify({ body }) }),

  update: (id: number, body: string) =>
    request<AnswerData>(`/answers/${id}`, { method: 'PUT', body: JSON.stringify({ body }) }),

  delete: (id: number) =>
    request<void>(`/answers/${id}`, { method: 'DELETE' }),

  accept: (id: number) =>
    request<AnswerData>(`/answers/${id}/accept`, { method: 'PUT' }),
};

// ====================
// Votes
// ====================
export interface VoteData {
  targetType: 'QUESTION' | 'ANSWER';
  targetId: number;
  currentVoteCount: number;
  userVote: number; // 1, -1, or 0
}

export const votesApi = {
  cast: (data: { targetType: 'QUESTION' | 'ANSWER'; targetId: number; value: 1 | -1 }) =>
    request<VoteData>('/votes', { method: 'POST', body: JSON.stringify(data) }),

  status: (targetType: 'QUESTION' | 'ANSWER', targetId: number) =>
    request<VoteData>(`/votes/status?targetType=${targetType}&targetId=${targetId}`),
};

// ====================
// Tags
// ====================
export const tagsApi = {
  list: (page = 0, size = 20) =>
    request<PagedData<TagData>>(`/tags?page=${page}&size=${size}`),

  popular: (page = 0, size = 10) =>
    request<PagedData<TagData>>(`/tags/popular?page=${page}&size=${size}`),

  search: (q: string, page = 0, size = 10) =>
    request<PagedData<TagData>>(`/tags/search?q=${encodeURIComponent(q)}&page=${page}&size=${size}`),
};

// ====================
// Comments
// ====================
export interface CommentData {
  id: number;
  body: string;
  author: UserSummary;
  createdAt: string;
}

export const commentsApi = {
  listForQuestion: (questionId: number, page = 0, size = 20) =>
    request<PagedData<CommentData>>(`/questions/${questionId}/comments?page=${page}&size=${size}`),

  addToQuestion: (questionId: number, body: string) =>
    request<CommentData>(`/questions/${questionId}/comments`, { method: 'POST', body: JSON.stringify({ body }) }),

  listForAnswer: (answerId: number, page = 0, size = 20) =>
    request<PagedData<CommentData>>(`/answers/${answerId}/comments?page=${page}&size=${size}`),

  addToAnswer: (answerId: number, body: string) =>
    request<CommentData>(`/answers/${answerId}/comments`, { method: 'POST', body: JSON.stringify({ body }) }),

  delete: (id: number) =>
    request<void>(`/comments/${id}`, { method: 'DELETE' }),
};

export { ApiError };
