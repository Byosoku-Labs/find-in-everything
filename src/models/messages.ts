import type { HttpCredentials } from "./credentials.js";
import type { ConnectionTestResult } from "../services/everythingHttpClient.js";
import type { SearchOptions, SearchResponse } from "./search.js";
import type { ExtensionSettings } from "./settings.js";

export const MAX_SEARCH_QUERY_LENGTH = 500;
export const MAX_CREDENTIAL_LENGTH = 1024;
export const MAX_PASSPHRASE_LENGTH = 1024;

export type ExtensionRequest =
  | {
      type: "SEARCH_EVERYTHING";
      query: string;
      offset: number;
      count: number;
      options: SearchOptions;
    }
  | {
      type: "OPEN_EVERYTHING";
      query: string;
      options: SearchOptions;
    }
  | {
      type: "OPEN_OPTIONS";
    }
  | {
      type: "TEST_CONNECTION";
      settings: Pick<ExtensionSettings, "serverUrl" | "timeoutMs">;
    }
  | {
      type: "SAVE_SETTINGS";
      settings: ExtensionSettings;
    }
  | {
      type: "GET_VAULT_STATUS";
    }
  | {
      type: "SAVE_CREDENTIALS";
      credentials: HttpCredentials;
      passphrase: string;
    }
  | {
      type: "UNLOCK_CREDENTIALS";
      passphrase: string;
    }
  | {
      type: "LOCK_CREDENTIALS";
    }
  | {
      type: "CLEAR_CREDENTIALS";
    };

export type SearchEverythingResponse =
  | { ok: true; response: SearchResponse }
  | { ok: false; message: string };

export type ConnectionTestResponse = {
  ok: true;
  result: ConnectionTestResult;
};

export type VaultStatusResponse = {
  ok: true;
  stored: boolean;
  unlocked: boolean;
};

export type UnlockCredentialsResponse =
  | { ok: true; username: string }
  | { ok: false; message: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isSearchOptions(value: unknown): value is SearchOptions {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.matchCase === "boolean" &&
    typeof value.matchPath === "boolean" &&
    typeof value.regex === "boolean" &&
    (value.sort === "name" ||
      value.sort === "path" ||
      value.sort === "size" ||
      value.sort === "date_modified") &&
    typeof value.ascending === "boolean"
  );
}

function isBoundedString(value: unknown, maxLength: number, allowEmpty = false): value is string {
  return (
    typeof value === "string" &&
    (allowEmpty || value.trim().length > 0) &&
    value.length <= maxLength
  );
}

function isBoundedInteger(value: unknown, minimum: number, maximum: number): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= minimum && value <= maximum;
}

function isSettings(value: unknown): value is ExtensionSettings {
  if (!isRecord(value)) {
    return false;
  }
  return (
    isBoundedString(value.serverUrl, 2048) &&
    isBoundedInteger(value.timeoutMs, 1000, 60000) &&
    isBoundedInteger(value.resultCount, 1, 1000) &&
    isSearchOptions({
      matchCase: value.matchCase,
      matchPath: value.matchPath,
      regex: value.regex,
      sort: value.sort,
      ascending: value.ascending
    }) &&
    typeof value.restoreLastSearch === "boolean"
  );
}

/** Validates every message before privileged work is performed in the service worker. */
export function isExtensionRequest(value: unknown): value is ExtensionRequest {
  if (!isRecord(value) || typeof value.type !== "string") {
    return false;
  }

  switch (value.type) {
    case "SEARCH_EVERYTHING":
      return (
        isBoundedString(value.query, MAX_SEARCH_QUERY_LENGTH) &&
        isBoundedInteger(value.offset, 0, 1_000_000) &&
        isBoundedInteger(value.count, 1, 1000) &&
        isSearchOptions(value.options)
      );
    case "OPEN_EVERYTHING":
      return isBoundedString(value.query, MAX_SEARCH_QUERY_LENGTH) && isSearchOptions(value.options);
    case "OPEN_OPTIONS":
    case "GET_VAULT_STATUS":
    case "LOCK_CREDENTIALS":
    case "CLEAR_CREDENTIALS":
      return true;
    case "TEST_CONNECTION":
      return (
        isRecord(value.settings) &&
        isBoundedString(value.settings.serverUrl, 2048) &&
        isBoundedInteger(value.settings.timeoutMs, 1000, 60000)
      );
    case "SAVE_SETTINGS":
      return isSettings(value.settings);
    case "SAVE_CREDENTIALS":
      return (
        isRecord(value.credentials) &&
        isBoundedString(value.credentials.username, MAX_CREDENTIAL_LENGTH, true) &&
        isBoundedString(value.credentials.password, MAX_CREDENTIAL_LENGTH, true) &&
        isBoundedString(value.passphrase, MAX_PASSPHRASE_LENGTH)
      );
    case "UNLOCK_CREDENTIALS":
      return isBoundedString(value.passphrase, MAX_PASSPHRASE_LENGTH);
    default:
      return false;
  }
}
