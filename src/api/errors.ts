export type FieldError = {
  field: string;
  code: string;
};

export type ProblemDetails = {
  type: string;
  title: string;
  status: number;
  code: string;
  detail: string;
  requestId?: string;
  errors?: FieldError[];
};

/**
 * Normalized transport or contract failure.
 *
 * `code` and `requestId` are preserved so support can correlate a customer
 * report with a backend request. `detail` is only safe for logs, never for
 * direct customer display, because it may contain provider or database text.
 */
export class ApiProblemError extends Error {
  readonly status: number;
  readonly code: string;
  readonly requestId?: string;
  readonly fieldErrors: FieldError[];

  constructor(problem: ProblemDetails, options?: { cause?: unknown }) {
    super(problem.detail);
    this.name = "ApiProblemError";
    this.status = problem.status;
    this.code = problem.code;
    this.requestId = problem.requestId;
    this.fieldErrors = problem.errors ?? [];
    if (options?.cause !== undefined) this.cause = options.cause;
  }
}

/** The response did not satisfy the documented contract. */
export class InvalidApiResponseError extends Error {
  constructor(
    message = "The service returned an invalid response.",
    options?: { cause?: unknown },
  ) {
    super(message);
    this.name = "InvalidApiResponseError";
    if (options?.cause !== undefined) this.cause = options.cause;
  }
}

export class RequestTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`The request did not complete within ${timeoutMs} ms.`);
    this.name = "RequestTimeoutError";
  }
}

export function isApiProblemError(error: unknown): error is ApiProblemError {
  return error instanceof ApiProblemError;
}
