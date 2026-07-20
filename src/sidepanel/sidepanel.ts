import {
  clearPendingSearch,
  getSessionSearchState,
  getSettings,
  getSetupDismissedPersistent,
  setSessionSearchState,
  setSetupDismissedPersistent
} from "../services/storageService.js";
import type { SearchOptions, SearchResultItem, SortField } from "../models/search.js";
import { formatDate } from "../utils/formatDate.js";
import { formatFileSize } from "../utils/formatFileSize.js";
import { calculatePageState } from "../utils/pagination.js";
import {
  CONNECTION_ERROR_GUIDE,
  ES_PROTOCOL_NOTE,
  LOCALHOST_SECURITY_NOTE,
  SETUP_GUIDE_14,
  SETUP_GUIDE_15
} from "../utils/setupGuide.js";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-600.css";
import { createIcon, setButtonContent } from "../ui/icons.js";
import {
  MAX_SEARCH_QUERY_LENGTH,
  type ConnectionTestResponse,
  type SearchEverythingResponse
} from "../models/messages.js";

const searchInput = document.getElementById("search-input") as HTMLInputElement;
const searchButton = document.getElementById("search-button") as HTMLButtonElement;
const openEverythingButton = document.getElementById("open-everything") as HTMLButtonElement;
const openOptionsButton = document.getElementById("open-options") as HTMLButtonElement;
const resultCountEl = document.getElementById("result-count") as HTMLElement;
const pageInfoEl = document.getElementById("page-info") as HTMLElement;
const loadingEl = document.getElementById("loading") as HTMLElement;
const errorEl = document.getElementById("error") as HTMLElement;
const retryButton = document.getElementById("retry") as HTMLButtonElement;
const resultsEl = document.getElementById("results") as HTMLUListElement;
const prevPageButton = document.getElementById("prev-page") as HTMLButtonElement;
const nextPageButton = document.getElementById("next-page") as HTMLButtonElement;
const setupPanel = document.getElementById("setup-panel") as HTMLElement;
const setupText = document.getElementById("setup-text") as HTMLElement;
const setupTestButton = document.getElementById("setup-test") as HTMLButtonElement;
const setupDismissButton = document.getElementById("setup-dismiss") as HTMLButtonElement;
const setupTestResult = document.getElementById("setup-test-result") as HTMLElement;
const localhostNote = document.getElementById("localhost-note") as HTMLElement;
const esNote = document.getElementById("es-note") as HTMLElement;
const optCase = document.getElementById("opt-case") as HTMLInputElement;
const optPath = document.getElementById("opt-path") as HTMLInputElement;
const optRegex = document.getElementById("opt-regex") as HTMLInputElement;
const optSort = document.getElementById("opt-sort") as HTMLSelectElement;
const optAscending = document.getElementById("opt-ascending") as HTMLSelectElement;
const optCount = document.getElementById("opt-count") as HTMLInputElement;

let currentOffset = 0;
let currentCount = 100;
let totalResults = 0;
let lastQuery = "";
let searching = false;
let openMenu: HTMLElement | null = null;
const isSidePanel = document.documentElement.dataset.surface === "sidepanel";

function initStaticIcons(): void {
  const searchFieldIcon = document.querySelector<HTMLElement>("[data-icon='search']");
  if (searchFieldIcon) {
    searchFieldIcon.replaceChildren(createIcon("search", { size: 18 }));
  }

  setButtonContent(searchButton, "search", "検索", { size: 16 });
  setButtonContent(openEverythingButton, "external-link", "Everythingで開く", { size: 16 });
  setButtonContent(prevPageButton, "chevron-left", "前ページ", { size: 16 });
  setButtonContent(nextPageButton, "chevron-right", "次ページ", { size: 16 });

  openOptionsButton.replaceChildren(createIcon("settings", { size: 18, label: "設定" }));

  const brandLogo = document.querySelector<HTMLImageElement>(".brand-logo");
  if (brandLogo) {
    brandLogo.src = chrome.runtime.getURL("icons/icon32.png");
  }
}

function closeOpenMenu(): void {
  if (openMenu) {
    openMenu.hidden = true;
    const trigger = openMenu.parentElement?.querySelector<HTMLButtonElement>(".menu-button");
    trigger?.setAttribute("aria-expanded", "false");
    openMenu = null;
  }
}

function readOptionsFromUi(): SearchOptions {
  return {
    matchCase: optCase.checked,
    matchPath: optPath.checked,
    regex: optRegex.checked,
    sort: optSort.value as SortField,
    ascending: optAscending.value === "1"
  };
}

function applyOptionsToUi(options: SearchOptions, count: number): void {
  optCase.checked = options.matchCase;
  optPath.checked = options.matchPath;
  optRegex.checked = options.regex;
  optSort.value = options.sort;
  optAscending.value = options.ascending ? "1" : "0";
  optCount.value = String(count);
  currentCount = count;
}

function setLoading(isLoading: boolean): void {
  searching = isLoading;
  loadingEl.hidden = !isLoading;
  searchButton.disabled = isLoading;
  openEverythingButton.disabled = isLoading;
  prevPageButton.disabled = isLoading || currentOffset <= 0;
  nextPageButton.disabled = isLoading || currentOffset + currentCount >= totalResults;
}

function showError(message: string): void {
  errorEl.hidden = false;
  errorEl.textContent = message;
  retryButton.hidden = false;
}

function clearError(): void {
  errorEl.hidden = true;
  errorEl.textContent = "";
  retryButton.hidden = true;
}

function renderResults(items: SearchResultItem[]): void {
  closeOpenMenu();
  resultsEl.replaceChildren();

  for (const item of items) {
    const li = document.createElement("li");
    li.className = "result-item";
    li.dataset.type = item.type;

    const top = document.createElement("div");
    top.className = "result-top";

    const icon = document.createElement("div");
    icon.className = "result-icon";
    icon.append(
      createIcon(item.type === "folder" ? "folder" : "file", {
        size: 18,
        label: item.type === "folder" ? "フォルダー" : "ファイル"
      })
    );

    const body = document.createElement("div");
    body.className = "result-body";

    const name = document.createElement("div");
    name.className = "result-name";
    name.textContent = item.name || "(無名)";
    name.title = item.name;

    const path = document.createElement("div");
    path.className = "result-path";
    path.textContent = item.fullPath || item.path || "-";
    path.title = item.fullPath || item.path;

    const meta = document.createElement("div");
    meta.className = "result-meta";
    meta.textContent = `${formatFileSize(item.size)} · ${formatDate(item.dateModified)}`;

    body.append(name, path, meta);
    top.append(icon, body);

    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.className = "button button-secondary copy-button";
    setButtonContent(copyButton, "copy", "パスをコピー", { size: 15 });
    copyButton.addEventListener("click", () => {
      void copyPath(item.fullPath, copyButton);
    });

    const menuButton = document.createElement("button");
    menuButton.type = "button";
    menuButton.className = "menu-button";
    menuButton.setAttribute("aria-label", "その他の操作");
    menuButton.setAttribute("aria-haspopup", "menu");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.append(createIcon("ellipsis", { size: 16 }));

    const menu = document.createElement("div");
    menu.className = "result-menu";
    menu.setAttribute("role", "menu");
    menu.hidden = true;

    const menuCopy = document.createElement("button");
    menuCopy.type = "button";
    menuCopy.className = "result-menu-item";
    menuCopy.setAttribute("role", "menuitem");
    setButtonContent(menuCopy, "copy", "パスをコピー", { size: 15 });
    menuCopy.addEventListener("click", () => {
      closeOpenMenu();
      void copyPath(item.fullPath, copyButton);
    });
    menu.append(menuCopy);

    menuButton.addEventListener("click", (event) => {
      event.stopPropagation();
      const willOpen = menu.hidden;
      closeOpenMenu();
      if (willOpen) {
        menu.hidden = false;
        openMenu = menu;
        menuButton.setAttribute("aria-expanded", "true");
      } else {
        menuButton.setAttribute("aria-expanded", "false");
      }
    });

    li.append(top, menuButton, menu, copyButton);
    resultsEl.append(li);
  }
}

async function copyPath(fullPath: string, button: HTMLButtonElement): Promise<void> {
  try {
    await navigator.clipboard.writeText(fullPath);
    setButtonContent(button, "check", "コピー済み", { size: 15 });
    setTimeout(() => {
      setButtonContent(button, "copy", "パスをコピー", { size: 15 });
    }, 1200);
  } catch {
    showError("クリップボードへのコピーに失敗しました。");
  }
}

function updateMeta(): void {
  resultCountEl.textContent =
    totalResults === 0 && lastQuery === ""
      ? "結果: -"
      : `結果: ${totalResults.toLocaleString("ja-JP")} 件`;

  const page = calculatePageState(currentOffset, currentCount, totalResults);
  pageInfoEl.textContent =
    totalResults === 0 ? "" : `${page.currentPage} / ${page.totalPages} ページ`;
  prevPageButton.disabled = searching || !page.canGoPrev;
  nextPageButton.disabled = searching || !page.canGoNext;
}

async function runSearch(resetOffset: boolean): Promise<void> {
  const text = searchInput.value.trim();
  if (text.length > MAX_SEARCH_QUERY_LENGTH) {
    showError(`検索文字列は${MAX_SEARCH_QUERY_LENGTH}文字以内で入力してください。`);
    return;
  }
  lastQuery = text;

  if (resetOffset) {
    currentOffset = 0;
  }

  currentCount = Math.max(1, Number(optCount.value) || 100);
  const options = readOptionsFromUi();

  await setSessionSearchState({
    lastSearchText: text,
    searchOptions: options,
    offset: currentOffset,
    pendingSearch: false
  });

  clearError();
  setLoading(true);

  try {
    const result = (await chrome.runtime.sendMessage({
      type: "SEARCH_EVERYTHING",
      query: text,
      offset: currentOffset,
      count: currentCount,
      options
    })) as SearchEverythingResponse;

    if (!result.ok) {
      renderResults([]);
      totalResults = 0;
      updateMeta();
      showError(result.message);
      return;
    }

    totalResults = result.response.totalResults;
    renderResults(result.response.items);
    updateMeta();

    if (result.response.totalResults === 0) {
      resultCountEl.textContent = "結果: 0 件";
    }
  } catch {
    renderResults([]);
    totalResults = 0;
    updateMeta();
    showError(CONNECTION_ERROR_GUIDE);
  } finally {
    setLoading(false);
  }
}

async function testConnection(): Promise<void> {
  setupTestResult.textContent = "接続確認中…";
  try {
    const settings = await getSettings();
    const response = (await chrome.runtime.sendMessage({
      type: "TEST_CONNECTION",
      settings: {
        serverUrl: settings.serverUrl,
        timeoutMs: settings.timeoutMs
      }
    })) as ConnectionTestResponse;
    const messages = {
      success: "接続に成功しました",
      unreachable: "接続できませんでした",
      unauthorized: "認証が必要です",
      invalid_response: "レスポンス形式を確認できませんでした"
    } as const;
    setupTestResult.textContent = messages[response.result];
  } catch {
    setupTestResult.textContent = "接続できませんでした";
  }
}

function setGuide(version: "14" | "15"): void {
  setupText.textContent = version === "14" ? SETUP_GUIDE_14 : SETUP_GUIDE_15;
  for (const tab of document.querySelectorAll<HTMLButtonElement>(".tab")) {
    const active = tab.dataset.guide === version;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", active ? "true" : "false");
  }
}

async function initSetupPanel(): Promise<void> {
  const dismissed = await getSetupDismissedPersistent();
  setupPanel.hidden = dismissed;
  localhostNote.textContent = LOCALHOST_SECURITY_NOTE;
  esNote.textContent = ES_PROTOCOL_NOTE;
  setGuide("14");
}

async function init(): Promise<void> {
  initStaticIcons();
  await initSetupPanel();

  const settings = await getSettings();
  const session = await getSessionSearchState();

  const options: SearchOptions = {
    matchCase: session.searchOptions.matchCase ?? settings.matchCase,
    matchPath: session.searchOptions.matchPath ?? settings.matchPath,
    regex: session.searchOptions.regex ?? settings.regex,
    sort: session.searchOptions.sort ?? settings.sort,
    ascending: session.searchOptions.ascending ?? settings.ascending
  };

  applyOptionsToUi(options, settings.resultCount);
  currentOffset = session.offset;
  currentCount = Number(optCount.value) || settings.resultCount;

  if (settings.restoreLastSearch || session.pendingSearch) {
    searchInput.value = session.lastSearchText;
  }

  if (session.pendingSearch && session.lastSearchText.trim()) {
    await clearPendingSearch();
    await runSearch(true);
  } else if (settings.restoreLastSearch && session.lastSearchText.trim()) {
    await runSearch(false);
  }

  updateMeta();
}

searchButton.addEventListener("click", () => {
  void runSearch(true);
});

searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    void runSearch(true);
  }
});

openEverythingButton.addEventListener("click", () => {
  const query = searchInput.value.trim();
  if (!query || query.length > MAX_SEARCH_QUERY_LENGTH) {
    return;
  }
  void chrome.runtime.sendMessage({
    type: "OPEN_EVERYTHING",
    query,
    options: readOptionsFromUi()
  });
});

openOptionsButton.addEventListener("click", () => {
  void chrome.runtime.sendMessage({ type: "OPEN_OPTIONS" });
});

prevPageButton.addEventListener("click", () => {
  currentOffset = Math.max(0, currentOffset - currentCount);
  void runSearch(false);
});

nextPageButton.addEventListener("click", () => {
  currentOffset = currentOffset + currentCount;
  void runSearch(false);
});

retryButton.addEventListener("click", () => {
  void runSearch(false);
});

setupTestButton.addEventListener("click", () => {
  void testConnection();
});

setupDismissButton.addEventListener("click", () => {
  void (async () => {
    await setSetupDismissedPersistent(true);
    await setSessionSearchState({ setupDismissed: true });
    setupPanel.hidden = true;
  })();
});

for (const tab of document.querySelectorAll<HTMLButtonElement>(".tab")) {
  tab.addEventListener("click", () => {
    const guide = tab.dataset.guide === "15" ? "15" : "14";
    setGuide(guide);
  });
}

for (const el of [optCase, optPath, optRegex, optSort, optAscending, optCount]) {
  el.addEventListener("change", () => {
    currentOffset = 0;
  });
}

document.addEventListener("click", () => {
  closeOpenMenu();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeOpenMenu();
  }
});

if (isSidePanel) {
  const port = chrome.runtime.connect({ name: "find-in-everything-sidepanel" });
  port.onMessage.addListener((message: unknown) => {
    if (
      typeof message === "object" &&
      message !== null &&
      (message as { type?: unknown }).type === "SEARCH_REQUESTED" &&
      typeof (message as { text?: unknown }).text === "string" &&
      (message as { text: string }).text.length <= MAX_SEARCH_QUERY_LENGTH
    ) {
      searchInput.value = (message as { text: string }).text;
      void runSearch(true);
    }
  });
}

void init();
