export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly field: string | undefined;
  readonly details: unknown;

  constructor(status: number, code: string, message: string, field?: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.field = field;
    this.details = details;
  }
}

export const badRequest = (code: string, message: string, field?: string) => new ApiError(400, code, message, field);
export const notFound = (message = 'Không tìm thấy.') => new ApiError(404, 'NOT_FOUND', message);
export const conflict = (code: string, message: string, details?: unknown) =>
  new ApiError(409, code, message, undefined, details);
