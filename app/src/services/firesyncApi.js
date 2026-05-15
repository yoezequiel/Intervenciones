import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

const BASE_URL = Constants.expoConfig?.extra?.FIRESYNC_API_URL || "";
const TOKEN_KEY = "firesync_token";
const USER_KEY = "firesync_user";

async function getToken() {
    return SecureStore.getItemAsync(TOKEN_KEY);
}

async function saveSession(token, user) {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
}

async function clearSession() {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
}

async function getStoredUser() {
    const raw = await SecureStore.getItemAsync(USER_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
}

async function request(path, options = {}) {
    const token = await getToken();
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: { ...headers, ...options.headers },
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
    return data;
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export async function register(email, password) {
    const data = await request("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, consent: true }),
    });
    await saveSession(data.token, { userId: data.userId, email: data.email });
    return data;
}

export async function login(email, password) {
    const data = await request("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
    });
    await saveSession(data.token, { userId: data.userId, email: data.email });
    return data;
}

export async function deleteAccount() {
    await request("/api/auth/account", { method: "DELETE" });
    await clearSession();
}

export async function logout() {
    await clearSession();
}

export { getStoredUser };

// ── Sync ─────────────────────────────────────────────────────────────────────

export async function pushBatch(interventions, communications) {
    return request("/api/sync/push", {
        method: "POST",
        body: JSON.stringify({ interventions, communications }),
    });
}

export async function pull(since) {
    const q = since ? `?since=${encodeURIComponent(since)}` : "";
    return request(`/api/sync/pull${q}`);
}

export async function exportData() {
    return request("/api/sync/export");
}
