import type { HttpCredentials } from "../models/credentials.js";
import {
  DEFAULT_SEARCH_OPTIONS,
  type SearchOptions,
  type SortField
} from "../models/search.js";
import { DEFAULT_SETTINGS, type ExtensionSettings } from "../models/settings.js";
import { normalizeServerUrl } from "./everythingHttpClient.js";

const SESSION_KEYS = {
  lastSearchText: "lastSearchText",
  searchOptions: "searchOptions",
  offset: "offset",
  setupDismissed: "setupDismissed",
  httpUsername: "httpUsername",
  httpPassword: "httpPassword",
  credentialsUnlockedAt: "credentialsUnlockedAt",
  pendingSearch: "pendingSearch"
} as const;

/** How long unlocked Basic auth stays available in session storage. */
export const CREDENTIAL_SESSION_TTL_MS = 30 * 60 * 1000;
export const CREDENTIAL_LOCK_ALARM = "lock-http-credentials";

export type SessionSearchState = {
  lastSearchText: string;
  searchOptions: SearchOptions;
  offset: number;
  setupDismissed: boolean;
  pendingSearch: boolean;
};

function isSortField(value: unknown): value is SortField {
  return value === "name" || value === "path" || value === "size" || value === "date_modified";
}

const MAX_RESULT_COUNT = 1000;
const MAX_TIMEOUT_MS = 60000;

function mergeSettings(raw: Partial<ExtensionSettings> | undefined): ExtensionSettings {
  const merged = { ...DEFAULT_SETTINGS, ...(raw ?? {}) };
  if (!isSortField(merged.sort)) {
    merged.sort = DEFAULT_SETTINGS.sort;
  }
  if (
    !Number.isFinite(merged.resultCount) ||
    merged.resultCount < 1 ||
    merged.resultCount > MAX_RESULT_COUNT
  ) {
    merged.resultCount = DEFAULT_SETTINGS.resultCount;
  }
  if (
    !Number.isFinite(merged.timeoutMs) ||
    merged.timeoutMs < 1000 ||
    merged.timeoutMs > MAX_TIMEOUT_MS
  ) {
    merged.timeoutMs = DEFAULT_SETTINGS.timeoutMs;
  }
  return merged;
}

export async function getSettings(): Promise<ExtensionSettings> {
  const result = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  return mergeSettings(result as Partial<ExtensionSettings>);
}

export async function saveSettings(settings: ExtensionSettings): Promise<void> {
  const validated = mergeSettings(settings);
  validated.serverUrl = normalizeServerUrl(settings.serverUrl);
  await chrome.storage.sync.set(validated);
}

export async function getSessionSearchState(): Promise<SessionSearchState> {
  const result = await chrome.storage.session.get([
    SESSION_KEYS.lastSearchText,
    SESSION_KEYS.searchOptions,
    SESSION_KEYS.offset,
    SESSION_KEYS.setupDismissed,
    SESSION_KEYS.pendingSearch
  ]);

  const options = (result[SESSION_KEYS.searchOptions] as SearchOptions | undefined) ?? {
    ...DEFAULT_SEARCH_OPTIONS
  };

  return {
    lastSearchText: (result[SESSION_KEYS.lastSearchText] as string | undefined) ?? "",
    searchOptions: {
      ...DEFAULT_SEARCH_OPTIONS,
      ...options,
      sort: isSortField(options.sort) ? options.sort : DEFAULT_SEARCH_OPTIONS.sort
    },
    offset: Number(result[SESSION_KEYS.offset] ?? 0) || 0,
    setupDismissed: Boolean(result[SESSION_KEYS.setupDismissed]),
    pendingSearch: Boolean(result[SESSION_KEYS.pendingSearch])
  };
}

export async function setLastSearchText(text: string): Promise<void> {
  await chrome.storage.session.set({
    [SESSION_KEYS.lastSearchText]: text,
    [SESSION_KEYS.pendingSearch]: true,
    [SESSION_KEYS.offset]: 0
  });
}

export async function setSessionSearchState(
  partial: Partial<SessionSearchState>
): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (partial.lastSearchText !== undefined) {
    payload[SESSION_KEYS.lastSearchText] = partial.lastSearchText;
  }
  if (partial.searchOptions !== undefined) {
    payload[SESSION_KEYS.searchOptions] = partial.searchOptions;
  }
  if (partial.offset !== undefined) {
    payload[SESSION_KEYS.offset] = partial.offset;
  }
  if (partial.setupDismissed !== undefined) {
    payload[SESSION_KEYS.setupDismissed] = partial.setupDismissed;
  }
  if (partial.pendingSearch !== undefined) {
    payload[SESSION_KEYS.pendingSearch] = partial.pendingSearch;
  }
  await chrome.storage.session.set(payload);
}

export async function clearPendingSearch(): Promise<void> {
  await chrome.storage.session.set({ [SESSION_KEYS.pendingSearch]: false });
}

export async function getUnlockedCredentials(): Promise<HttpCredentials | undefined> {
  const result = await chrome.storage.session.get([
    SESSION_KEYS.httpUsername,
    SESSION_KEYS.httpPassword,
    SESSION_KEYS.credentialsUnlockedAt
  ]);
  const username = result[SESSION_KEYS.httpUsername] as string | undefined;
  const password = result[SESSION_KEYS.httpPassword] as string | undefined;
  const unlockedAt = Number(result[SESSION_KEYS.credentialsUnlockedAt] ?? 0);
  if (username === undefined || password === undefined || !unlockedAt) {
    return undefined;
  }
  if (Date.now() - unlockedAt > CREDENTIAL_SESSION_TTL_MS) {
    await clearUnlockedCredentials();
    return undefined;
  }
  return { username, password };
}

export async function setUnlockedCredentials(credentials: HttpCredentials): Promise<void> {
  await chrome.storage.session.set({
    [SESSION_KEYS.httpUsername]: credentials.username,
    [SESSION_KEYS.httpPassword]: credentials.password,
    [SESSION_KEYS.credentialsUnlockedAt]: Date.now()
  });
  await chrome.alarms.create(CREDENTIAL_LOCK_ALARM, {
    delayInMinutes: CREDENTIAL_SESSION_TTL_MS / 60_000
  });
}

export async function clearUnlockedCredentials(): Promise<void> {
  await chrome.storage.session.remove([
    SESSION_KEYS.httpUsername,
    SESSION_KEYS.httpPassword,
    SESSION_KEYS.credentialsUnlockedAt
  ]);
  await chrome.alarms.clear(CREDENTIAL_LOCK_ALARM);
}

export async function getSetupDismissedPersistent(): Promise<boolean> {
  const result = await chrome.storage.local.get("setupDismissed");
  return Boolean(result.setupDismissed);
}

export async function setSetupDismissedPersistent(value: boolean): Promise<void> {
  await chrome.storage.local.set({ setupDismissed: value });
}
