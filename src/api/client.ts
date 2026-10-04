import { z } from "zod";

import {
  ApiProblemError,
  InvalidApiResponseError,
  RequestTimeoutError,
  type ProblemDetails,
} from "@/api/errors";

export const DEFAULT_API_TIMEOUT_MS = 15_000;
export const DEFAULT_PAGE_LIMIT = 50;

const FALLBACK_API_URL = "https://hng-shop-task.vercel.app/api/v1";

/**
 * `application/problem+json` payload described in `docs/API_CONTRACT.md`.
 *
 * Unknown members are tolerated: the contract allows additive optional fields
 * within version 1 and requires clients to ignore them.
 */
export const problemSchema = z
  .object({
    type: z.string().optional(),
    title: z.string().optional(),
    status: z.number().int().optional(),
    code: z.string(),
    detail: z.string().optional(),
    /** Legacy message key still used by the shared-cart routes. */
    error: z.string().optional(),
    requestId: z.string().optional(),
    errors: z
      .array(z.object({ field: z.string(), code: z.string() }).passthrough())
      .optional(),
  })
  .passthrough();

/** Legacy shape still returned by the deployed shared-cart routes. */
const legacyErrorSchema = z
  .object({ code: z.string(), error: z.string() })
  .passthrough();

export function getApiBaseUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim();
  const base =
    configured && configured.length > 0 ? configured : FALLBACK_API_URL;
  return base.replace(/\/+$/, "");
}

export function buildApiPath(
  path: string,
  query?: Record<string, string | number | undefined>,
): string {
  if (!query) return path;
  const entries = Object.entries(query).filter(
    (entry): entry is [string, string | number] => {
      const value = entry[1];
      return value !== undefined && value !== "";
    },
  );
  if (entries.length === 0) return path;
  const search = new URLSearchParams(
    entries.map(([key, value]) => [key, String(value)]),
  );
  return `${path}?${search.toString()}`;
}

export type ApiRequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  /** Supabase access token. Never persisted outside secure storage. */
  token?: string | null;
  /** Extra request headers, for example `Idempotency-Key`. */
  headers?: Record<string, string>;
  signal?: AbortSignal;
  timeoutMs?: number;
};

function toProblem(
  status: number,
  body: unknown,
  requestIdHeader: string | null,
): ProblemDetails {
  const parsed = problemSchema.safeParse(body);
  if (parsed.success) {
    const value = parsed.data;
    const requestId = value.requestId ?? requestIdHeader ?? undefined;
    return {
      type:
        value.type ?? `https://hng.shop/problems/${value.code.toLowerCase()}`,
      title: value.title ?? "Request failed",
      status: value.status ?? status,
      code: value.code,
      detail:
        value.detail ??
        value.error ??
        value.title ??
        "The request could not be completed.",
      ...(requestId ? { requestId } : {}),
      ...(value.errors ? { errors: value.errors } : {}),
    };
  }

  const legacy = legacyErrorSchema.safeParse(body);
  const detail = legacy.success
    ? legacy.data.error
    : "The request could not be completed.";

  return {
    type: `https://hng.shop/problems/unexpected-${status}`,
    title: "Request failed",
    status,
    code: "UNEXPECTED_ERROR",
    detail,
    ...(requestIdHeader ? { requestId: requestIdHeader } : {}),
  };
}

async function readJson(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("json")) {
    // Undeployed routes on this origin currently fall through to the web app
    // and answer with HTML. Never hand a rendered page to a DTO parser.
    throw new InvalidApiResponseError(
      "The service returned an unexpected response.",
    );
  }

  try {
    return await response.json();
  } catch (cause) {
    throw new InvalidApiResponseError("The service returned malformed JSON.", {
      cause,
    });
  }
}

async function requestJson(
  path: string,
  options: ApiRequestOptions = {},
): Promise<unknown> {
  const {
    method = "GET",
    body,
    token,
    timeoutMs = DEFAULT_API_TIMEOUT_MS,
  } = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const abortFromCaller = () => controller.abort();
  options.signal?.addEventListener("abort", abortFromCaller);

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...options.headers,
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      method,
      headers,
      signal: controller.signal,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch (cause) {
    if (controller.signal.aborted) throw new RequestTimeoutError(timeoutMs);
    throw cause;
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener("abort", abortFromCaller);
  }

  if (!response.ok) {
    let errorBody: unknown;
    try {
      errorBody = await response.json();
    } catch {
      errorBody = undefined;
    }
    throw new ApiProblemError(
      toProblem(
        response.status,
        errorBody,
        response.headers.get("x-request-id"),
      ),
    );
  }

  if (response.status === 204) return undefined;
  return readJson(response);
}

export const apiClient = {
  getJson: (
    path: string,
    options: Omit<ApiRequestOptions, "method" | "body"> = {},
  ) => requestJson(path, { ...options, method: "GET" }),
  request: requestJson,
};
