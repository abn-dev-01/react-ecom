// Thin wrapper around fetch so every component doesn't re-implement the
// same "parse JSON, check response.ok, throw something useful" dance.
// Real apps often reach for a library (React Query, SWR, ky) for this;
// this is the same idea in ~20 lines so the mechanics stay visible.

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

async function parseJsonSafely(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function getJson<TResponse>(
  url: string,
  signal?: AbortSignal
): Promise<TResponse> {
  const response = await fetch(url, { signal });
  const data = await parseJsonSafely(response);

  if (!response.ok) {
    const message =
      (data as { error?: string } | null)?.error ?? "Request failed.";
    throw new ApiError(message, response.status, data);
  }

  return data as TResponse;
}

export async function postJson<TResponse>(
  url: string,
  body: unknown
): Promise<TResponse> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await parseJsonSafely(response);

  if (!response.ok) {
    const message =
      (data as { error?: string } | null)?.error ?? "Request failed.";
    throw new ApiError(message, response.status, data);
  }

  return data as TResponse;
}
