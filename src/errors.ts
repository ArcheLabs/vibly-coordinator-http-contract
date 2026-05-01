export interface CoordinatorErrorPayload {
  code?: string;
  message?: string;
  details?: unknown;
}

export class CoordinatorApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details?: unknown;

  constructor(input: { status: number; message: string; code?: string; details?: unknown }) {
    super(input.message);
    this.name = "CoordinatorApiError";
    this.status = input.status;
    if (input.code !== undefined) this.code = input.code;
    if (input.details !== undefined) this.details = input.details;
  }
}
