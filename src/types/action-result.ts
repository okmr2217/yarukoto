export type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "INTERNAL_ERROR";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: ErrorCode };

export function success<T>(data: T): ActionResult<T> {
  return { success: true, data };
}

export function failure(error: string, code?: ErrorCode): ActionResult<never> {
  return { success: false, error, code };
}
