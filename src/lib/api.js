const LOCAL_API_BASE_URL = "http://localhost:4000";
const DEPLOYED_API_BASE_URL = "https://nidvoter.rsitlink.com";
const MISCONFIGURED_API_BASE_URLS = new Map([
  ["https://rsitlink.com", DEPLOYED_API_BASE_URL],
  ["http://rsitlink.com", DEPLOYED_API_BASE_URL],
]);

function resolveApiBaseUrl() {
  const configuredBaseUrl = String(process.env.NEXT_PUBLIC_API_BASE_URL || "")
    .trim()
    .replace(/\/$/, "");

  if (configuredBaseUrl) {
    return MISCONFIGURED_API_BASE_URLS.get(configuredBaseUrl) || configuredBaseUrl;
  }

  if (typeof window !== "undefined" && window.location.hostname === "nid-voter-frontend.vercel.app") {
    return DEPLOYED_API_BASE_URL;
  }

  return LOCAL_API_BASE_URL;
}

export const API_BASE_URL = resolveApiBaseUrl();

export async function fetchJson(path, options = {}) {
  const requestUrl = path.startsWith("http") || !API_BASE_URL ? path : `${API_BASE_URL}${path}`;
  const response = await fetch(requestUrl, {
    credentials: "include",
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const errorBody = await response.json();
      if (errorBody?.message) {
        message = errorBody.message;
      }
    } catch (_error) {
      // Keep the generic message when the response is not JSON.
    }

    throw new Error(message);
  }

  return response.json();
}

export async function sendJson(path, { body, method = "POST", ...options } = {}) {
  return fetchJson(path, {
    method,
    body: JSON.stringify(body || {}),
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });
}

export function buildQuery(params) {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value == null) continue;
    const normalized = String(value).trim();
    if (!normalized) continue;
    query.set(key, normalized);
  }

  return query.toString();
}
