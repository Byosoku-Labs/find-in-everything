import type { HttpCredentials } from "../models/credentials.js";
import type { EverythingRawResponse, EverythingRawResult } from "../models/everythingResponse.js";
import type { SearchRequest, SearchResponse, SearchResultItem } from "../models/search.js";
import { AppError } from "../utils/errorUtils.js";
import { isFolderType, joinPath } from "../utils/pathUtils.js";

export type ConnectionTestResult =
  | "success"
  | "unreachable"
  | "unauthorized"
  | "invalid_response";

const ALLOWED_HOSTS = new Set(["localhost", "127.0.0.1"]);

export function assertAllowedServerUrl(serverUrl: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(serverUrl);
  } catch {
    throw new AppError("INVALID_URL", "接続先URLが不正です。");
  }

  if (parsed.protocol !== "http:") {
    throw new AppError("INVALID_URL", "接続先は http://localhost または http://127.0.0.1 のみ対応しています。");
  }

  if (!ALLOWED_HOSTS.has(parsed.hostname)) {
    throw new AppError(
      "INVALID_URL",
      "初期版では http://localhost と http://127.0.0.1 のみ正式サポートしています。"
    );
  }

  if (parsed.username || parsed.password) {
    throw new AppError("INVALID_URL", "接続先URLに認証情報を含めることはできません。");
  }

  const port = parsed.port ? Number(parsed.port) : 80;
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new AppError("INVALID_URL", "接続先のポート番号が不正です。");
  }

  return parsed;
}

export function normalizeServerUrl(serverUrl: string): string {
  const url = assertAllowedServerUrl(serverUrl);
  url.pathname = "/";
  url.search = "";
  url.hash = "";
  return url.toString().replace(/\/$/, "");
}

export function buildSearchUrl(serverUrl: string, request: SearchRequest): string {
  const base = normalizeServerUrl(serverUrl);
  const url = new URL(base.endsWith("/") ? base : `${base}/`);

  url.searchParams.set("search", request.text);
  url.searchParams.set("json", "1");
  url.searchParams.set("offset", String(request.offset));
  url.searchParams.set("count", String(request.count));
  url.searchParams.set("path_column", "1");
  url.searchParams.set("size_column", "1");
  url.searchParams.set("date_modified_column", "1");
  url.searchParams.set("sort", request.options.sort);
  url.searchParams.set("ascending", request.options.ascending ? "1" : "0");
  url.searchParams.set("case", request.options.matchCase ? "1" : "0");
  url.searchParams.set("path", request.options.matchPath ? "1" : "0");
  url.searchParams.set("regex", request.options.regex ? "1" : "0");

  return url.toString();
}

function parseSize(value: number | string | undefined): number | undefined {
  if (value === undefined || value === "") {
    return undefined;
  }
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : undefined;
}

function mapResult(raw: EverythingRawResult): SearchResultItem {
  const name = raw.name ?? "";
  const path = raw.path ?? "";
  return {
    name,
    path,
    fullPath: joinPath(path, name),
    size: parseSize(raw.size),
    dateModified:
      raw.date_modified === undefined || raw.date_modified === ""
        ? undefined
        : String(raw.date_modified),
    type: isFolderType(raw.type) ? "folder" : "file"
  };
}

export function mapEverythingResponse(raw: EverythingRawResponse): SearchResponse {
  if (raw === null || typeof raw !== "object") {
    throw new AppError("UNEXPECTED_RESPONSE", "想定外のレスポンス形式です。");
  }

  if (!Array.isArray(raw.results)) {
    throw new AppError("UNEXPECTED_RESPONSE", "想定外のレスポンス形式です。");
  }

  const total =
    raw.totalResults === undefined || raw.totalResults === ""
      ? raw.results.length
      : Number(raw.totalResults);

  if (!Number.isFinite(total)) {
    throw new AppError("UNEXPECTED_RESPONSE", "想定外のレスポンス形式です。");
  }

  return {
    totalResults: total,
    items: raw.results.map(mapResult)
  };
}

function buildAuthHeader(credentials?: HttpCredentials): HeadersInit | undefined {
  if (!credentials) {
    return undefined;
  }
  const bytes = new TextEncoder().encode(`${credentials.username}:${credentials.password}`);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  const token = btoa(binary);
  return {
    Authorization: `Basic ${token}`
  };
}

export class EverythingHttpClient {
  constructor(
    private readonly serverUrl: string,
    private readonly timeoutMs: number,
    private readonly credentials?: HttpCredentials
  ) {}

  async search(request: SearchRequest): Promise<SearchResponse> {
    const url = buildSearchUrl(this.serverUrl, request);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        method: "GET",
        redirect: "error",
        signal: controller.signal,
        headers: buildAuthHeader(this.credentials)
      });

      if (response.status === 401) {
        throw new AppError("UNAUTHORIZED", "認証が必要です。", 401);
      }
      if (response.status === 403) {
        throw new AppError("FORBIDDEN", "アクセスが拒否されました。", 403);
      }
      if (!response.ok) {
        throw new AppError("HTTP_ERROR", `HTTPエラー: ${response.status}`, response.status);
      }

      let json: unknown;
      try {
        json = await response.json();
      } catch {
        throw new AppError("INVALID_JSON", "JSONの解析に失敗しました。");
      }

      return mapEverythingResponse(json as EverythingRawResponse);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new AppError("TIMEOUT", "リクエストがタイムアウトしました。");
      }
      if (error instanceof TypeError) {
        throw new AppError("NETWORK", "Everything HTTP Serverに接続できませんでした。");
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  async testConnection(): Promise<ConnectionTestResult> {
    try {
      await this.search({
        text: "",
        offset: 0,
        count: 1,
        options: {
          matchCase: false,
          matchPath: false,
          regex: false,
          sort: "name",
          ascending: true
        }
      });
      return "success";
    } catch (error) {
      if (error instanceof AppError) {
        if (error.code === "UNAUTHORIZED" || error.code === "FORBIDDEN") {
          return "unauthorized";
        }
        if (error.code === "INVALID_JSON" || error.code === "UNEXPECTED_RESPONSE") {
          return "invalid_response";
        }
      }
      return "unreachable";
    }
  }
}
