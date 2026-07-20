import type { SearchOptions } from "../models/search.js";

function mapSortForEsProtocol(sort: SearchOptions["sort"]): string {
  if (sort === "date_modified") {
    return "date-modified";
  }
  return sort;
}

export function createEverythingUrl(searchText: string, options: SearchOptions): string {
  const params = new URLSearchParams({
    case: options.matchCase ? "1" : "0",
    path: options.matchPath ? "1" : "0",
    regex: options.regex ? "1" : "0",
    sort: mapSortForEsProtocol(options.sort),
    ascending: options.ascending ? "1" : "0"
  });

  return `es:${encodeURIComponent(searchText)}?${params.toString()}`;
}

export async function openEverythingUrl(url: string): Promise<void> {
  await chrome.tabs.create({ url });
}
