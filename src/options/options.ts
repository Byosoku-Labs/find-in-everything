import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-600.css";
import { getSettings } from "../services/storageService.js";
import { ensureHostPermissionForServerUrl } from "../services/hostPermission.js";
import { MIN_PASSPHRASE_LENGTH } from "../services/credentialVault.js";
import type { ExtensionSettings } from "../models/settings.js";
import type { SortField } from "../models/search.js";
import {
  LOCALHOST_SECURITY_NOTE,
  SETUP_GUIDE_14,
  SETUP_GUIDE_15
} from "../utils/setupGuide.js";
import type {
  ConnectionTestResponse,
  UnlockCredentialsResponse,
  VaultStatusResponse
} from "../models/messages.js";
import { toAppError } from "../utils/errorUtils.js";

const serverUrlInput = document.getElementById("server-url") as HTMLInputElement;
const timeoutInput = document.getElementById("timeout-ms") as HTMLInputElement;
const resultCountInput = document.getElementById("result-count") as HTMLInputElement;
const sortSelect = document.getElementById("sort") as HTMLSelectElement;
const ascendingSelect = document.getElementById("ascending") as HTMLSelectElement;
const matchCaseInput = document.getElementById("match-case") as HTMLInputElement;
const matchPathInput = document.getElementById("match-path") as HTMLInputElement;
const regexInput = document.getElementById("regex") as HTMLInputElement;
const restoreInput = document.getElementById("restore-last-search") as HTMLInputElement;
const saveSettingsButton = document.getElementById("save-settings") as HTMLButtonElement;
const saveResult = document.getElementById("save-result") as HTMLElement;
const testButton = document.getElementById("test-connection") as HTMLButtonElement;
const testResult = document.getElementById("test-result") as HTMLElement;
const localhostNote = document.getElementById("localhost-note") as HTMLElement;
const setupText = document.getElementById("setup-text") as HTMLElement;

const usernameInput = document.getElementById("http-username") as HTMLInputElement;
const passwordInput = document.getElementById("http-password") as HTMLInputElement;
const passphraseInput = document.getElementById("master-passphrase") as HTMLInputElement;
const passphraseConfirmInput = document.getElementById(
  "master-passphrase-confirm"
) as HTMLInputElement;
const saveCredentialsButton = document.getElementById("save-credentials") as HTMLButtonElement;
const unlockButton = document.getElementById("unlock-credentials") as HTMLButtonElement;
const lockButton = document.getElementById("lock-credentials") as HTMLButtonElement;
const clearButton = document.getElementById("clear-credentials") as HTMLButtonElement;
const vaultStatus = document.getElementById("vault-status") as HTMLElement;
const vaultResult = document.getElementById("vault-result") as HTMLElement;

function readSettingsFromUi(): ExtensionSettings {
  return {
    serverUrl: serverUrlInput.value.trim(),
    timeoutMs: Number(timeoutInput.value) || 5000,
    resultCount: Number(resultCountInput.value) || 100,
    sort: sortSelect.value as SortField,
    ascending: ascendingSelect.value === "1",
    matchCase: matchCaseInput.checked,
    matchPath: matchPathInput.checked,
    regex: regexInput.checked,
    restoreLastSearch: restoreInput.checked
  };
}

function applySettingsToUi(settings: ExtensionSettings): void {
  serverUrlInput.value = settings.serverUrl;
  timeoutInput.value = String(settings.timeoutMs);
  resultCountInput.value = String(settings.resultCount);
  sortSelect.value = settings.sort;
  ascendingSelect.value = settings.ascending ? "1" : "0";
  matchCaseInput.checked = settings.matchCase;
  matchPathInput.checked = settings.matchPath;
  regexInput.checked = settings.regex;
  restoreInput.checked = settings.restoreLastSearch;
}

async function refreshVaultStatus(): Promise<void> {
  const response = (await chrome.runtime.sendMessage({
    type: "GET_VAULT_STATUS"
  })) as VaultStatusResponse;
  if (!response.stored) {
    vaultStatus.textContent = "保存済み認証情報: なし";
  } else if (response.unlocked) {
    vaultStatus.textContent = "保存済み認証情報: あり（解除済み）";
  } else {
    vaultStatus.textContent = "保存済み認証情報: あり（ロック中）";
  }
}

function setGuide(version: "14" | "15"): void {
  setupText.textContent = version === "14" ? SETUP_GUIDE_14 : SETUP_GUIDE_15;
  for (const tab of document.querySelectorAll<HTMLButtonElement>(".tab")) {
    const active = tab.dataset.guide === version;
    tab.classList.toggle("active", active);
  }
}

async function init(): Promise<void> {
  localhostNote.textContent = LOCALHOST_SECURITY_NOTE;
  setGuide("14");
  applySettingsToUi(await getSettings());
  await refreshVaultStatus();
}

saveSettingsButton.addEventListener("click", () => {
  void (async () => {
    try {
      const settings = readSettingsFromUi();
      await ensureHostPermissionForServerUrl(settings.serverUrl);
      const response = (await chrome.runtime.sendMessage({
        type: "SAVE_SETTINGS",
        settings
      })) as { ok: boolean; message?: string };
      if (!response.ok) {
        throw new Error(response.message);
      }
      saveResult.textContent = "設定を保存しました";
    } catch (error) {
      saveResult.textContent = toAppError(error).message || "設定の保存に失敗しました";
    }
  })();
});

testButton.addEventListener("click", () => {
  void (async () => {
    testResult.textContent = "接続確認中…";
    try {
      const settings = readSettingsFromUi();
      await ensureHostPermissionForServerUrl(settings.serverUrl);
      const response = (await chrome.runtime.sendMessage({
        type: "TEST_CONNECTION",
        settings: {
          serverUrl: settings.serverUrl,
          timeoutMs: settings.timeoutMs
        }
      })) as ConnectionTestResponse | { ok: false; message?: string };
      if (!response.ok) {
        throw new Error(response.message);
      }
      const messages = {
        success: "接続に成功しました",
        unreachable: "接続できませんでした",
        unauthorized: "認証が必要です",
        invalid_response: "レスポンス形式を確認できませんでした"
      } as const;
      testResult.textContent = messages[response.result];
    } catch (error) {
      testResult.textContent = toAppError(error).message || "接続できませんでした";
    }
  })();
});

saveCredentialsButton.addEventListener("click", () => {
  void (async () => {
    const passphrase = passphraseInput.value;
    const confirm = passphraseConfirmInput.value;
    if (!passphrase) {
      vaultResult.textContent = "マスターパスフレーズを入力してください";
      return;
    }
    if (passphrase.length < MIN_PASSPHRASE_LENGTH) {
      vaultResult.textContent = `マスターパスフレーズは${MIN_PASSPHRASE_LENGTH}文字以上にしてください`;
      return;
    }
    if (passphrase !== confirm) {
      vaultResult.textContent = "パスフレーズが一致しません";
      return;
    }

    try {
      const response = (await chrome.runtime.sendMessage({
        type: "SAVE_CREDENTIALS",
        credentials: {
          username: usernameInput.value,
          password: passwordInput.value
        },
        passphrase
      })) as { ok: boolean; message?: string };
      if (!response.ok) {
        throw new Error(response.message);
      }
      passphraseInput.value = "";
      passphraseConfirmInput.value = "";
      passwordInput.value = "";
      vaultResult.textContent = "認証情報を暗号化して保存しました";
      await refreshVaultStatus();
    } catch (error) {
      vaultResult.textContent = toAppError(error).message || "保存に失敗しました";
    }
  })();
});

unlockButton.addEventListener("click", () => {
  void (async () => {
    try {
      const response = (await chrome.runtime.sendMessage({
        type: "UNLOCK_CREDENTIALS",
        passphrase: passphraseInput.value
      })) as UnlockCredentialsResponse;
      if (!response.ok) {
        vaultResult.textContent = response.message;
        return;
      }
      usernameInput.value = response.username;
      passwordInput.value = "";
      passphraseInput.value = "";
      vaultResult.textContent = "解除しました";
      await refreshVaultStatus();
    } catch {
      vaultResult.textContent = "解除に失敗しました";
    }
  })();
});

lockButton.addEventListener("click", () => {
  void (async () => {
    await chrome.runtime.sendMessage({ type: "LOCK_CREDENTIALS" });
    passwordInput.value = "";
    vaultResult.textContent = "ロックしました";
    await refreshVaultStatus();
  })();
});

clearButton.addEventListener("click", () => {
  void (async () => {
    await chrome.runtime.sendMessage({ type: "CLEAR_CREDENTIALS" });
    usernameInput.value = "";
    passwordInput.value = "";
    passphraseInput.value = "";
    passphraseConfirmInput.value = "";
    vaultResult.textContent = "認証情報を削除しました";
    await refreshVaultStatus();
  })();
});

for (const tab of document.querySelectorAll<HTMLButtonElement>(".tab")) {
  tab.addEventListener("click", () => {
    setGuide(tab.dataset.guide === "15" ? "15" : "14");
  });
}

void init();
