import { Platform } from "react-native";
import { fetch as expoFetch } from "expo/fetch";

import { storage } from "@/src/utils/storage";

const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? "";
const TOKEN_KEY = "hsu.auth.token";

let token: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

export async function loadToken(): Promise<string | null> {
  token = await storage.secureGet(TOKEN_KEY, null);
  return token;
}

export async function saveToken(value: string) {
  token = value;
  await storage.secureSet(TOKEN_KEY, value);
}

export async function clearToken() {
  token = null;
  await storage.secureRemove(TOKEN_KEY);
}

function authHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { ...authHeaders(), ...(init.headers as object) },
  });
  if (response.status === 401) {
    await clearToken();
    onUnauthorized?.();
    throw new Error("unauthorized");
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body?.detail || `HTTP ${response.status}`);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export type User = {
  user_id: string;
  email: string;
  name: string;
  picture?: string | null;
  language: string;
  study_program?: string | null;
  provider: string;
};

export type ScheduleEntry = {
  entry_id: string;
  title: string;
  type: string;
  professor?: string | null;
  location?: string | null;
  weekday: number;
  start_time: string;
  end_time: string;
};

export type Grade = {
  grade_id: string;
  semester: string;
  course: string;
  ects: number;
  grade: number;
};

export type GradesResponse = {
  grades: Grade[];
  total_ects: number;
  average: number | null;
};

export type Meal = {
  menu_id: string;
  date: string;
  category: string;
  name: string;
  price_student: number;
  price_staff: number;
  tags: string[];
};

export type NewsItem = {
  news_id: string;
  title: string;
  summary: string;
  body: string;
  category: string;
  image_url: string;
  published_at: string;
};

export type ChatMessage = {
  message_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

export const authApi = {
  register: (email: string, password: string, name: string) =>
    api<{ access_token: string; user: User }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    }),
  login: (email: string, password: string) =>
    api<{ access_token: string; user: User }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  googleSession: (sessionId: string) =>
    api<{ session_token: string; user: User }>("/api/auth/session", {
      method: "POST",
      body: JSON.stringify({ session_id: sessionId }),
    }),
  me: () => api<User>("/api/auth/me"),
  updateMe: (body: Partial<Pick<User, "name" | "study_program">> & { language?: string }) =>
    api<User>("/api/auth/me", { method: "PATCH", body: JSON.stringify(body) }),
};

export const campusApi = {
  schedule: () => api<ScheduleEntry[]>("/api/schedule"),
  createSchedule: (body: Omit<ScheduleEntry, "entry_id">) =>
    api<ScheduleEntry>("/api/schedule", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  deleteSchedule: (entryId: string) =>
    api<{ deleted: boolean }>(`/api/schedule/${entryId}`, { method: "DELETE" }),
  grades: () => api<GradesResponse>("/api/grades"),
  createGrade: (body: Omit<Grade, "grade_id">) =>
    api<Grade>("/api/grades", { method: "POST", body: JSON.stringify(body) }),
  deleteGrade: (gradeId: string) =>
    api<{ deleted: boolean }>(`/api/grades/${gradeId}`, { method: "DELETE" }),
  mensa: (day: string) =>
    api<{ date: string; meals: Meal[] }>(`/api/mensa?day=${day}`),
  news: () => api<NewsItem[]>("/api/news"),
};

export const aiApi = {
  messages: () => api<ChatMessage[]>("/api/ai/messages"),
  clear: () => api<{ deleted: boolean }>("/api/ai/messages", { method: "DELETE" }),
};

// Streams the assistant reply. Falls back to reading the full body when the
// runtime has no streaming support.
export async function streamChat(
  message: string,
  onDelta: (delta: string) => void,
): Promise<void> {
  const streamFetch = Platform.OS === "web" ? fetch : (expoFetch as typeof fetch);
  const response = await streamFetch(`${BASE_URL}/api/ai/chat`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ message }),
  });

  if (response.status === 401) {
    await clearToken();
    onUnauthorized?.();
    throw new Error("unauthorized");
  }
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const handleChunk = (chunk: string, buffer: string): string => {
    const combined = buffer + chunk;
    const parts = combined.split("\n\n");
    const rest = parts.pop() ?? "";
    for (const part of parts) {
      const line = part.trim();
      if (!line.startsWith("data:")) continue;
      try {
        const payload = JSON.parse(line.slice(5).trim());
        if (payload.delta) onDelta(payload.delta);
        if (payload.error) throw new Error(payload.error);
      } catch {
        // ignore malformed keep-alive chunks
      }
    }
    return rest;
  };

  const canStream =
    typeof TextDecoder !== "undefined" && !!(response.body as any)?.getReader;

  if (!canStream) {
    const text = await response.text();
    handleChunk(text, "");
    return;
  }

  const reader = (response.body as any).getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer = handleChunk(decoder.decode(value, { stream: true }), buffer);
  }
}
