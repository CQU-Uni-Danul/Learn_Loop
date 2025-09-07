// Shared API wrapper with token + 401 handling
const apiBase = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export async function api(path, { method = "GET", body, headers } = {}) {
  const token = sessionStorage.getItem("accessToken");

  const res = await fetch(`${apiBase}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("currentUser");
    window.location.href = "/"; // back to login
    return;
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.detail || "Request failed");
  }
  return data;
}
