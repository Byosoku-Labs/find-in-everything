export type SortField = "name" | "path" | "size" | "date_modified";

export type SearchOptions = {
  matchCase: boolean;
  matchPath: boolean;
  regex: boolean;
  sort: SortField;
  ascending: boolean;
};

export type SearchRequest = {
  text: string;
  offset: number;
  count: number;
  options: SearchOptions;
};

export type SearchResultItem = {
  name: string;
  path: string;
  fullPath: string;
  size?: number;
  dateModified?: string;
  type: "file" | "folder";
};

export type SearchResponse = {
  totalResults: number;
  items: SearchResultItem[];
};

export type PaginationState = {
  offset: number;
  count: number;
  totalResults: number;
};

export const DEFAULT_SEARCH_OPTIONS: SearchOptions = {
  matchCase: false,
  matchPath: false,
  regex: false,
  sort: "name",
  ascending: true
};
