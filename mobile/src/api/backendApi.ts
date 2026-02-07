/**
 * Backend API client for auth and charge operations.
 * Uses EXPO_PUBLIC_BACKEND_API_URL from .env (e.g. http://localhost:4000 or http://10.0.2.2:4000 for Android emulator).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKEND_API_URL } from '../constants/config';

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
} as const;

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'admin' | 'user';
  tenantId?: string | null;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

async function request<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {}
): Promise<T> {
  const { token, ...init } = options;
  const url = `${BACKEND_API_URL}/api${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };
  const accessToken = token ?? (await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN));
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  const res = await fetch(url, { ...init, headers });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string; message?: string };

  if (res.status === 401) {
    const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    if (refreshToken && !path.includes('/auth/refresh') && !(init as { _retry?: boolean })._retry) {
      try {
        const refreshed = await refreshTokens(refreshToken);
        if (refreshed) {
          return request<T>(path, { ...init, _retry: true } as RequestInit & { _retry?: boolean });
        }
      } catch {
        await clearAuth();
        throw new Error('SESSION_EXPIRED');
      }
    }
    await clearAuth();
    throw new Error('SESSION_EXPIRED');
  }

  if (!res.ok) {
    const msg = data.error || data.message || res.statusText || 'Request failed';
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }
  return data;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const data = await request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    token: null,
  });
  await saveAuth(data);
  return data;
}

export async function refreshTokens(refreshToken: string): Promise<boolean> {
  const data = await request<{ accessToken: string; refreshToken: string }>('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
    token: null,
  });
  await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.accessToken);
  await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
  return true;
}

export async function logout(): Promise<void> {
  const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  if (token && refreshToken) {
    try {
      await request('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
        token: token,
      });
    } catch {
      // ignore
    }
  }
  await clearAuth();
}

export async function getMe(): Promise<User> {
  return request<User>('/auth/me');
}

export async function startCharge(params: {
  chargePointId: string;
  connectorId?: number;
}): Promise<{ success: boolean; status: string; chargePointId: string }> {
  return request('/charge/start', {
    method: 'POST',
    body: JSON.stringify({
      chargePointId: params.chargePointId,
      connectorId: params.connectorId ?? 1,
    }),
  });
}

async function saveAuth(data: LoginResponse): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.accessToken);
  await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
  await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
}

export async function clearAuth(): Promise<void> {
  await AsyncStorage.multiRemove([
    STORAGE_KEYS.ACCESS_TOKEN,
    STORAGE_KEYS.REFRESH_TOKEN,
    STORAGE_KEYS.USER,
  ]);
}

export async function getStoredAuth(): Promise<{
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
}> {
  const [accessToken, refreshToken, userJson] = await AsyncStorage.multiGet([
    STORAGE_KEYS.ACCESS_TOKEN,
    STORAGE_KEYS.REFRESH_TOKEN,
    STORAGE_KEYS.USER,
  ]);
  let user: User | null = null;
  if (userJson[1]) {
    try {
      user = JSON.parse(userJson[1]) as User;
    } catch {
      // ignore
    }
  }
  return {
    accessToken: accessToken[1],
    refreshToken: refreshToken[1],
    user,
  };
}
