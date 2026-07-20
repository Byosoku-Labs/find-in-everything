import { AppError } from "../utils/errorUtils.js";
import { assertAllowedServerUrl } from "./everythingHttpClient.js";

/** Ports covered by required host_permissions in the manifest. */
export const DEFAULT_ALLOWED_PORTS = new Set([8080]);

export function getServerPort(serverUrl: string): number {
  const url = assertAllowedServerUrl(serverUrl);
  if (url.port) {
    return Number(url.port);
  }
  return 80;
}

export function originsForPort(port: number): string[] {
  return [`http://localhost:${port}/*`, `http://127.0.0.1:${port}/*`];
}

export async function hasHostPermissionForServerUrl(serverUrl: string): Promise<boolean> {
  const port = getServerPort(serverUrl);
  if (DEFAULT_ALLOWED_PORTS.has(port)) {
    return true;
  }
  return chrome.permissions.contains({ origins: originsForPort(port) });
}

/**
 * Requests optional host access for non-default ports.
 * Must run in an extension page during a user gesture (e.g. Save / Test).
 */
export async function ensureHostPermissionForServerUrl(serverUrl: string): Promise<void> {
  if (await hasHostPermissionForServerUrl(serverUrl)) {
    return;
  }

  const port = getServerPort(serverUrl);
  const granted = await chrome.permissions.request({ origins: originsForPort(port) });
  if (!granted) {
    throw new AppError(
      "INVALID_URL",
      `ポート ${port} へのアクセスが許可されませんでした。設定を保存する際に許可するか、既定の 8080 を使用してください。`
    );
  }
}
