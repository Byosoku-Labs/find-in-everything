import { EverythingHttpClient } from "../services/everythingHttpClient.js";
import {
  createEverythingUrl,
  openEverythingUrl
} from "../services/everythingUrlProtocol.js";
import { hasHostPermissionForServerUrl } from "../services/hostPermission.js";
import {
  clearUnlockedCredentials,
  CREDENTIAL_LOCK_ALARM,
  getSettings,
  getUnlockedCredentials,
  saveSettings,
  setLastSearchText,
  setUnlockedCredentials
} from "../services/storageService.js";
import {
  clearEncryptedCredentials,
  encryptAndSave,
  hasStoredCredentials,
  unlockCredentials
} from "../services/credentialVault.js";
import {
  isExtensionRequest,
  MAX_SEARCH_QUERY_LENGTH,
  type ConnectionTestResponse,
  type ExtensionRequest,
  type SearchEverythingResponse,
  type UnlockCredentialsResponse,
  type VaultStatusResponse
} from "../models/messages.js";
import { AppError, toAppError } from "../utils/errorUtils.js";
import { CONNECTION_ERROR_GUIDE } from "../utils/setupGuide.js";

const MENU_SELECTION_ID = "find-in-everything-selection";
const MENU_PAGE_TITLE_ID = "find-in-everything-page-title";
const SIDEPANEL_PORT_NAME = "find-in-everything-sidepanel";
const sidePanelPorts = new Set<chrome.runtime.Port>();

async function registerContextMenus(): Promise<void> {
  await chrome.contextMenus.removeAll();
  chrome.contextMenus.create({
    id: MENU_SELECTION_ID,
    title: 'Everythingで「%s」を検索',
    contexts: ["selection"]
  });
  chrome.contextMenus.create({
    id: MENU_PAGE_TITLE_ID,
    title: "Everythingでページタイトルを検索",
    contexts: ["page"]
  });
}

chrome.runtime.onInstalled.addListener(() => {
  void registerContextMenus();
});

chrome.runtime.onStartup.addListener(() => {
  void registerContextMenus();
});

async function openSidePanelForTab(tab: chrome.tabs.Tab): Promise<void> {
  if (tab.id !== undefined) {
    await chrome.sidePanel.open({ tabId: tab.id });
    return;
  }
  if (tab.windowId !== undefined) {
    await chrome.sidePanel.open({ windowId: tab.windowId });
  }
}

function safeSearchError(error: unknown): string {
  const appError = toAppError(error);
  if (
    appError.code === "NETWORK" ||
    appError.code === "TIMEOUT" ||
    appError.code === "INVALID_URL"
  ) {
    return appError.message.includes("ポート") ? appError.message : CONNECTION_ERROR_GUIDE;
  }
  if (appError.code === "UNAUTHORIZED" || appError.code === "FORBIDDEN") {
    return "認証が必要です。設定画面で HTTP 認証情報を保存・解除してから再試行してください。";
  }
  return "検索に失敗しました。";
}

async function assertHostPermission(serverUrl: string): Promise<void> {
  if (await hasHostPermissionForServerUrl(serverUrl)) {
    return;
  }
  throw new AppError(
    "INVALID_URL",
    "このポートへのアクセス許可がありません。設定画面で接続先を保存し、表示される権限ダイアログを許可してください。"
  );
}

async function handleSearch(
  request: Extract<ExtensionRequest, { type: "SEARCH_EVERYTHING" }>
): Promise<SearchEverythingResponse> {
  try {
    const settings = await getSettings();
    await assertHostPermission(settings.serverUrl);
    const credentials = await getUnlockedCredentials();
    const client = new EverythingHttpClient(
      settings.serverUrl,
      settings.timeoutMs,
      credentials
    );
    const response = await client.search({
      text: request.query,
      offset: request.offset,
      count: request.count,
      options: request.options
    });

    return { ok: true, response };
  } catch (error) {
    return { ok: false, message: safeSearchError(error) };
  }
}

async function startSearch(query: string, tab: chrome.tabs.Tab | undefined): Promise<void> {
  const text = query.trim();
  if (!text || text.length > MAX_SEARCH_QUERY_LENGTH || !tab) {
    return;
  }

  await setLastSearchText(text);

  if (sidePanelPorts.size > 0) {
    let notified = false;
    for (const port of [...sidePanelPorts]) {
      try {
        port.postMessage({ type: "SEARCH_REQUESTED", text });
        notified = true;
      } catch {
        sidePanelPorts.delete(port);
      }
    }
    if (notified) {
      return;
    }
  }

  if (tab.windowId !== undefined && typeof chrome.action.openPopup === "function") {
    try {
      await chrome.action.openPopup({ windowId: tab.windowId });
      return;
    } catch {
      // Chrome 127 未満やポリシーで Popup を開けない場合は Side Panel を使用する。
    }
  }

  await openSidePanelForTab(tab);
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === MENU_SELECTION_ID) {
    const selection = (info.selectionText ?? "").trim();
    if (!selection) {
      return;
    }
    void startSearch(selection, tab);
    return;
  }

  if (info.menuItemId === MENU_PAGE_TITLE_ID) {
    const title = (tab?.title ?? "").trim();
    if (!title) {
      return;
    }
    void startSearch(title, tab);
  }
});

function isExtensionPageSender(sender: chrome.runtime.MessageSender): boolean {
  return sender.id === chrome.runtime.id && sender.url?.startsWith(chrome.runtime.getURL("")) === true;
}

chrome.runtime.onConnect.addListener((port) => {
  if (
    port.name !== SIDEPANEL_PORT_NAME ||
    port.sender?.id !== chrome.runtime.id ||
    port.sender.url !== chrome.runtime.getURL("src/sidepanel/sidepanel.html")
  ) {
    port.disconnect();
    return;
  }

  sidePanelPorts.add(port);
  port.onDisconnect.addListener(() => {
    sidePanelPorts.delete(port);
  });
});

async function handleRequest(message: ExtensionRequest): Promise<unknown> {
  switch (message.type) {
    case "SEARCH_EVERYTHING":
      return handleSearch(message);
    case "OPEN_EVERYTHING":
      await openEverythingUrl(createEverythingUrl(message.query, message.options));
      return { ok: true };
    case "OPEN_OPTIONS":
      await chrome.runtime.openOptionsPage();
      return { ok: true };
    case "TEST_CONNECTION": {
      await assertHostPermission(message.settings.serverUrl);
      const client = new EverythingHttpClient(
        message.settings.serverUrl,
        message.settings.timeoutMs,
        await getUnlockedCredentials()
      );
      return { ok: true, result: await client.testConnection() } satisfies ConnectionTestResponse;
    }
    case "SAVE_SETTINGS":
      await assertHostPermission(message.settings.serverUrl);
      await saveSettings(message.settings);
      return { ok: true };
    case "GET_VAULT_STATUS":
      return {
        ok: true,
        stored: await hasStoredCredentials(),
        unlocked: (await getUnlockedCredentials()) !== undefined
      } satisfies VaultStatusResponse;
    case "SAVE_CREDENTIALS":
      await encryptAndSave(message.credentials, message.passphrase);
      await setUnlockedCredentials(message.credentials);
      return { ok: true };
    case "UNLOCK_CREDENTIALS":
      try {
        const credentials = await unlockCredentials(message.passphrase);
        await setUnlockedCredentials(credentials);
        return { ok: true, username: credentials.username } satisfies UnlockCredentialsResponse;
      } catch {
        return {
          ok: false,
          message: "パスフレーズが違うか、認証情報を復号できません。"
        } satisfies UnlockCredentialsResponse;
      }
    case "LOCK_CREDENTIALS":
      await clearUnlockedCredentials();
      return { ok: true };
    case "CLEAR_CREDENTIALS":
      await clearEncryptedCredentials();
      await clearUnlockedCredentials();
      return { ok: true };
  }
}

chrome.runtime.onMessage.addListener((message: unknown, sender, sendResponse) => {
  if (!isExtensionPageSender(sender) || !isExtensionRequest(message)) {
    sendResponse({ ok: false, message: "許可されていない要求です。" });
    return true;
  }

  void handleRequest(message)
    .then(sendResponse)
    .catch((error: unknown) => {
      const appError = toAppError(error);
      sendResponse({ ok: false, message: appError.message || "操作に失敗しました。" });
    });
  return true;
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === CREDENTIAL_LOCK_ALARM) {
    void clearUnlockedCredentials();
  }
});
