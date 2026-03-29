import axios from 'axios';
import { getAPIBaseURL } from './config';
import { getStoredAuthToken } from './auth';
const apiClient = axios.create({
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getStoredAuthToken();
  if (token) {
    config.headers = {
      ...(config.headers || {}),
      Authorization: `Bearer ${token}`,
    } as any;
  }
  return config;
});

function apiUrl(path: string) {
  return `${getAPIBaseURL()}${path}`;
}

// Paper types
export interface Paper {
  id: number;
  user_id: string;
  title: string;
  course_code: string;
  course_name: string;
  college: string;
  department: string;
  year: number;
  paper_type: string;
  lecturer: string | null;
  description: string | null;
  file_key: string | null;
  solution_key: string | null;
  verification_status: string;
  download_count: number | null;
  report_count: number | null;
  is_hidden: boolean | null;
  created_at: string | null;
}

export interface PaperListResponse {
  items: Paper[];
  total: number;
  skip: number;
  limit: number;
  data_source?: 'live' | 'cache';
}

export interface Comment {
  id: number;
  user_id: string;
  paper_id: number;
  content: string;
  parent_id: number | null;
  upvotes: number | null;
  created_at: string | null;
}

export interface Solution {
  id: number;
  user_id: string;
  paper_id: number;
  content: string;
  file_key: string | null;
  upvotes: number | null;
  is_best: boolean | null;
  created_at: string | null;
}

export interface UserProfile {
  id: number;
  user_id: string;
  display_name: string;
  role: string;
  trust_score: number | null;
  upload_count: number | null;
  download_count: number | null;
  institution_type?: 'ur_student' | 'other_university' | null;
  university_name?: string | null;
  ur_student_code?: string | null;
  ur_verification_status?: 'not_requested' | 'pending' | 'verified' | 'rejected' | null;
  profile_picture_key?: string | null;
  phone_number?: string | null;
  college_name?: string | null;
  department_name?: string | null;
  year_of_study?: string | null;
  bio?: string | null;
  account_status?: string | null;
  suspension_reason?: string | null;
  suspended_until?: string | null;
  email?: string | null;
  name?: string | null;
  auth_role?: string | null;
  last_login?: string | null;
  created_at: string | null;
}

export interface NotificationItem {
  id: number;
  user_id: string;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean | null;
  related_entity: string | null;
  related_entity_id: number | null;
  created_at: string | null;
}

export interface CommunityReportResult {
  paper: {
    id: number;
    report_count: number;
    is_hidden: boolean;
  };
}

export interface AdminOverview {
  stats: {
    total_papers: number;
    hidden_papers: number;
    verified_papers: number;
    total_reports: number;
    pending_reports: number;
    total_users: number;
  };
  top_contributors: UserProfile[];
  recent_reports: Array<{
    id: number;
    paper_id: number;
    user_id: string;
    reason: string;
    status: string | null;
    created_at: string | null;
  }>;
}

export interface AIStudyResponse {
  content: string;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

const PAPERS_CACHE_KEY = 'ur-hud-paper-cache-v1';
const MY_PAPERS_CACHE_KEY = 'ur-hud-my-paper-cache-v1';

function offlineCacheKey(kind: 'paper' | 'solution', id: number) {
  return `/offline-docs/${kind}-${id}.pdf`;
}

function readCachedPaperList(): PaperListResponse | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(PAPERS_CACHE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PaperListResponse;
  } catch {
    return null;
  }
}

function writeCachedPaperList(data: PaperListResponse) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PAPERS_CACHE_KEY, JSON.stringify(data));
}

function readCachedMyPaperList(): PaperListResponse | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(MY_PAPERS_CACHE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PaperListResponse;
  } catch {
    return null;
  }
}

function writeCachedMyPaperList(data: PaperListResponse) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(MY_PAPERS_CACHE_KEY, JSON.stringify(data));
}

function paperField(item: Paper, key: string): unknown {
  return (item as unknown as Record<string, unknown>)[key];
}

export async function uploadFileObject(
  bucketName: string,
  objectKey: string,
  file: File
): Promise<string> {
  const formData = new FormData();
  formData.append('bucket_name', bucketName);
  formData.append('object_key', objectKey);
  formData.append('file', file);

  const response = await apiClient.post(apiUrl('/api/v1/storage/upload'), formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  const storedObjectKey = response.data?.object_key as string | undefined;
  if (!storedObjectKey) {
    throw new Error('Stored object key was not returned by the server');
  }

  return storedObjectKey;
}

export async function getStorageDownloadUrl(
  bucketName: string,
  objectKey: string
): Promise<string | null> {
  const response = await apiClient.post(apiUrl('/api/v1/storage/download-url'), {
    bucket_name: bucketName,
    object_key: objectKey,
  });

  const downloadUrl = response.data?.download_url as string | undefined;
  return downloadUrl || null;
}

// API helpers
export async function fetchAllPapers(params?: {
  query?: Record<string, unknown>;
  sort?: string;
  limit?: number;
  skip?: number;
}): Promise<PaperListResponse> {
  try {
    const response = await apiClient.get(apiUrl('/api/v1/entities/papers/all'), {
      params: {
        query: JSON.stringify(params?.query || {}),
        sort: params?.sort || '-created_at',
        limit: params?.limit || 50,
        skip: params?.skip || 0,
      },
    });
    const data = response.data as PaperListResponse;
    if (!params?.query || Object.keys(params.query).length === 0) {
      writeCachedPaperList(data);
    }
    return {
      ...data,
      data_source: 'live',
    };
  } catch (error) {
    const cached = readCachedPaperList();
    if (cached) {
      let items = [...cached.items];
      if (params?.query) {
        items = items.filter((item) =>
          Object.entries(params.query || {}).every(([key, value]) => paperField(item, key) === value)
        );
      }
      const sort = params?.sort || '-created_at';
      if (sort) {
        const reverse = sort.startsWith('-');
        const field = reverse ? sort.slice(1) : sort;
        items.sort((a, b) => {
          const left = paperField(a, field);
          const right = paperField(b, field);
          if (left === right) return 0;
          if (left == null) return reverse ? 1 : -1;
          if (right == null) return reverse ? -1 : 1;
          if (typeof left === 'number' && typeof right === 'number') {
            return reverse ? right - left : left - right;
          }
          return reverse
            ? String(right).localeCompare(String(left))
            : String(left).localeCompare(String(right));
        });
      }
      return {
        items: items.slice(params?.skip || 0, (params?.skip || 0) + (params?.limit || 50)),
        total: items.length,
        skip: params?.skip || 0,
        limit: params?.limit || 50,
        data_source: 'cache',
      };
    }
    throw error;
  }
}

export async function fetchPaperById(id: number): Promise<Paper> {
  const data = await fetchAllPapers({
    query: { id },
    limit: 1,
  });
  if (data.items.length === 0) throw new Error('Paper not found');
  return data.items[0];
}

export async function createPaper(data: Partial<Paper>): Promise<Paper> {
  const response = await apiClient.post(apiUrl('/api/v1/community/papers'), data);
  return response.data as Paper;
}

export async function fetchMyPapers(): Promise<PaperListResponse> {
  try {
    const response = await apiClient.get(apiUrl('/api/v1/entities/papers'), {
      params: {
        sort: '-created_at',
        limit: 100,
        skip: 0,
      },
    });
    const data = response.data as PaperListResponse;
    writeCachedMyPaperList(data);
    return {
      ...data,
      data_source: 'live',
    };
  } catch (error) {
    const cached = readCachedMyPaperList();
    if (cached) {
      return {
        ...cached,
        data_source: 'cache',
      };
    }
    throw error;
  }
}

export async function deleteMyPaper(paperId: number): Promise<void> {
  await apiClient.delete(apiUrl(`/api/v1/entities/papers/${paperId}`));
}

export async function createComment(data: {
  paper_id: number;
  content: string;
  parent_id?: number;
}): Promise<Comment> {
  const response = await apiClient.post(apiUrl(`/api/v1/community/papers/${data.paper_id}/comments`), {
    content: data.content,
    parent_id: data.parent_id,
  });
  return response.data as Comment;
}

export async function fetchComments(paperId: number): Promise<{ items: Comment[]; total: number }> {
  try {
    const response = await apiClient.get(apiUrl('/api/v1/entities/comments/all'), {
      params: {
        query: JSON.stringify({ paper_id: paperId }),
        sort: '-created_at',
        limit: 100,
        skip: 0,
      },
    });
    return response.data as { items: Comment[]; total: number };
  } catch {
    return { items: [], total: 0 };
  }
}

export async function createSolution(data: {
  paper_id: number;
  content: string;
  file_key?: string;
}): Promise<Solution> {
  const response = await apiClient.post(apiUrl(`/api/v1/community/papers/${data.paper_id}/solutions`), {
    content: data.content,
  });
  return response.data as Solution;
}

export async function fetchSolutions(paperId: number): Promise<{ items: Solution[]; total: number }> {
  try {
    const response = await apiClient.get(apiUrl('/api/v1/entities/solutions/all'), {
      params: {
        query: JSON.stringify({ paper_id: paperId }),
        sort: '-upvotes',
        limit: 100,
        skip: 0,
      },
    });
    return response.data as { items: Solution[]; total: number };
  } catch {
    return { items: [], total: 0 };
  }
}

export async function createReport(data: {
  paper_id: number;
  reason: string;
}): Promise<CommunityReportResult> {
  const response = await apiClient.post(apiUrl(`/api/v1/community/papers/${data.paper_id}/report`), {
    reason: data.reason,
  });
  return response.data as CommunityReportResult;
}

export async function fetchUserProfile(): Promise<UserProfile | null> {
  try {
    const response = await apiClient.get(apiUrl('/api/v1/community/profile'));
    return response.data as UserProfile;
  } catch {
    return null;
  }
}

export async function createUserProfile(data: {
  display_name: string;
  role?: string;
}): Promise<UserProfile> {
  const response = await apiClient.post(apiUrl('/api/v1/entities/user_profiles'), {
    display_name: data.display_name,
    role: data.role || 'normal',
    trust_score: 0,
    upload_count: 0,
    download_count: 0,
  });
  return response.data as UserProfile;
}

export async function updateUserProfile(data: {
  display_name?: string;
  institution_type?: 'ur_student' | 'other_university';
  university_name?: string | null;
  ur_student_code?: string | null;
  profile_picture_key?: string | null;
  phone_number?: string | null;
  college_name?: string | null;
  department_name?: string | null;
  year_of_study?: string | null;
  bio?: string | null;
}): Promise<UserProfile> {
  const response = await apiClient.patch(apiUrl('/api/v1/community/profile'), data);
  return response.data as UserProfile;
}

export async function upvoteSolution(solutionId: number): Promise<Solution> {
  const response = await apiClient.post(apiUrl(`/api/v1/community/solutions/${solutionId}/upvote`));
  return response.data as Solution;
}

export async function upvoteComment(commentId: number): Promise<Comment> {
  const response = await apiClient.post(apiUrl(`/api/v1/community/comments/${commentId}/upvote`));
  return response.data as Comment;
}

export async function recordPaperDownload(paperId: number): Promise<{ download_count: number }> {
  const response = await apiClient.post(apiUrl(`/api/v1/community/papers/${paperId}/record-download`));
  return response.data as { download_count: number };
}

export async function fetchLeaderboard(): Promise<UserProfile[]> {
  const response = await apiClient.get(apiUrl('/api/v1/community/leaderboard'));
  return response.data.items as UserProfile[];
}

export async function fetchAdminOverview(): Promise<AdminOverview> {
  const response = await apiClient.get(apiUrl('/api/v1/admin/hub/overview'));
  return response.data as AdminOverview;
}

export async function fetchAdminUsers(search?: string): Promise<UserProfile[]> {
  const response = await apiClient.get(apiUrl('/api/v1/admin/hub/users'), {
    params: search ? { search } : undefined,
  });
  return response.data.items as UserProfile[];
}

export async function moderatePaper(
  paperId: number,
  data: { verification_status?: string; is_hidden?: boolean }
): Promise<Paper> {
  const response = await apiClient.patch(apiUrl(`/api/v1/admin/hub/papers/${paperId}`), data);
  return response.data as Paper;
}

export async function updateAdminUser(
  profileId: number,
  data: {
    email?: string;
    display_name?: string;
    role?: string;
    trust_score?: number;
    account_status?: string;
    ur_verification_status?: string;
    institution_type?: 'ur_student' | 'other_university';
    university_name?: string | null;
    ur_student_code?: string | null;
    profile_picture_key?: string | null;
    phone_number?: string | null;
    college_name?: string | null;
    department_name?: string | null;
    year_of_study?: string | null;
    bio?: string | null;
    suspension_reason?: string;
    suspended_until?: string | null;
  }
): Promise<UserProfile> {
  const response = await apiClient.patch(apiUrl(`/api/v1/admin/hub/users/${profileId}`), data);
  return response.data as UserProfile;
}

export async function deleteAdminUser(profileId: number): Promise<void> {
  await apiClient.delete(apiUrl(`/api/v1/admin/hub/users/${profileId}`));
}

export async function updateAdminReport(
  reportId: number,
  data: { status: string; hide_paper?: boolean; verification_status?: string }
): Promise<void> {
  await apiClient.patch(apiUrl(`/api/v1/admin/hub/reports/${reportId}`), data);
}

export async function fetchNotifications(): Promise<NotificationItem[]> {
  const response = await apiClient.get(apiUrl('/api/v1/notifications'));
  return response.data.items as NotificationItem[];
}

export async function markNotificationRead(notificationId: number, isRead = true): Promise<NotificationItem> {
  const response = await apiClient.patch(apiUrl(`/api/v1/notifications/${notificationId}`), {
    is_read: isRead,
  });
  return response.data as NotificationItem;
}

export async function markAllNotificationsRead(): Promise<{ updated: number }> {
  const response = await apiClient.post(apiUrl('/api/v1/notifications/read-all'));
  return response.data as { updated: number };
}

export async function runStudyAI(paperId: number, action: 'explain' | 'summarize'): Promise<AIStudyResponse> {
  const response = await apiClient.post(apiUrl(`/api/v1/study-ai/papers/${paperId}`), { action });
  return response.data as AIStudyResponse;
}

export async function saveDocumentOffline(sourceUrl: string, kind: 'paper' | 'solution', id: number): Promise<string> {
  if (!('caches' in window)) {
    throw new Error('Offline cache is not supported in this browser');
  }
  const cache = await caches.open('ur-hud-offline-documents');
  const response = await fetch(sourceUrl, { mode: 'cors' });
  if (!response.ok) {
    throw new Error('Failed to fetch document for offline storage');
  }
  const key = offlineCacheKey(kind, id);
  await cache.put(key, response.clone());
  return key;
}

export async function getOfflineDocumentUrl(kind: 'paper' | 'solution', id: number): Promise<string | null> {
  if (!('caches' in window)) {
    return null;
  }
  const cache = await caches.open('ur-hud-offline-documents');
  const key = offlineCacheKey(kind, id);
  const cached = await cache.match(key);
  return cached ? key : null;
}
