export type AppErrorCode =
  | "INVALID_URL"
  | "NETWORK"
  | "TIMEOUT"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "HTTP_ERROR"
  | "INVALID_JSON"
  | "UNEXPECTED_RESPONSE"
  | "CLIPBOARD"
  | "DECRYPT_FAILED"
  | "UNKNOWN";

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly status?: number;

  constructor(code: AppErrorCode, message: string, status?: number) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function toAppError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (error instanceof DOMException && error.name === "AbortError") {
    return new AppError("TIMEOUT", "リクエストがタイムアウトしました。");
  }

  if (error instanceof TypeError) {
    return new AppError("NETWORK", "Everything HTTP Serverに接続できませんでした。");
  }

  if (error instanceof Error) {
    return new AppError("UNKNOWN", error.message);
  }

  return new AppError("UNKNOWN", "不明なエラーが発生しました。");
}
