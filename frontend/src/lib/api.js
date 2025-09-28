// Base URL for the backend API
const apiBase = import.meta.env.VITE_API_BASE || "http://localhost:8000";

/**
 * apiFetch
 * - Adds JSON headers
 * - Attaches Bearer token from sessionStorage
 * - Throws Error with readable message on non-2xx
 */
export async function apiFetch(path, options = {}) {
  const token = sessionStorage.getItem("accessToken");

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${apiBase}${path}`, { ...options, headers });

  if (!res.ok) {
    let message = `API error (${res.status})`;
    try {
      const data = await res.json();
      if (data?.detail) message = data.detail;
      else if (typeof data === "string") message = data;
      else message = JSON.stringify(data);
    } catch { /* ignore */ }
    throw new Error(message);
  }

  if (res.status === 204) return null;
  return res.json();
}

/* ---------- USERS (read-only for dashboard list) ---------- */
export async function listUsers({ role, skip = 0, limit = 200 } = {}) {
  const params = new URLSearchParams();
  if (role) params.set("role", role);
  params.set("skip", String(skip));
  params.set("limit", String(limit));
  return apiFetch(`/api/users/?${params.toString()}`);
}

/* ---------------------------
   Students (CRUD)
   NOTE: collection endpoints use trailing slash (avoid 307 redirect)
---------------------------- */
export async function createStudent(payload) {
  // payload: { full_name, email, password, grade?, class: "A" }
  return apiFetch("/api/students/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listStudents({ q, grade, _class, skip = 0, limit = 50 } = {}) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (grade) params.set("grade", grade);
  if (_class) params.set("_class", _class);
  params.set("skip", String(skip));
  params.set("limit", String(limit));
  return apiFetch(`/api/students/?${params.toString()}`);
}

export async function getStudent(id) {
  return apiFetch(`/api/students/${id}`);
}

export async function updateStudent(id, patch) {
  return apiFetch(`/api/students/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function deleteStudent(id) {
  return apiFetch(`/api/students/${id}`, { method: "DELETE" });
}

/* ---------------------------
   Teachers (CRUD) — added
   Uses /api/teacher prefix (as in your main.py include)
   NOTE: collection endpoints use trailing slash
---------------------------- */
export async function listTeachers({ q, subject, skip = 0, limit = 50 } = {}) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (subject) params.set("subject", subject);
  params.set("skip", String(skip));
  params.set("limit", String(limit));
  return apiFetch(`/api/teacher/?${params.toString()}`);
}

export async function getTeacher(id) {
  return apiFetch(`/api/teacher/${id}`);
}

export async function createTeacher(payload) {
  return apiFetch("/api/teacher/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateTeacher(id, patch) {
  return apiFetch(`/api/teacher/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function deleteTeacher(id) {
  return apiFetch(`/api/teacher/${id}`, { method: "DELETE" });
}
