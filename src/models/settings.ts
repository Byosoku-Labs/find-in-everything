import type { SortField } from "./search.js";

export type ExtensionSettings = {
  serverUrl: string;
  resultCount: number;
  timeoutMs: number;
  sort: SortField;
  ascending: boolean;
  matchCase: boolean;
  matchPath: boolean;
  regex: boolean;
  restoreLastSearch: boolean;
};

export const DEFAULT_SETTINGS: ExtensionSettings = {
  serverUrl: "http://localhost:8080",
  resultCount: 100,
  timeoutMs: 5000,
  sort: "name",
  ascending: true,
  matchCase: false,
  matchPath: false,
  regex: false,
  restoreLastSearch: true
};
