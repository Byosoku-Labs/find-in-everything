export type EverythingResultType = "file" | "folder";

export type EverythingRawResult = {
  type?: string;
  name?: string;
  path?: string;
  size?: number | string;
  date_modified?: string | number;
};

export type EverythingRawResponse = {
  totalResults?: number | string;
  results?: EverythingRawResult[];
};
