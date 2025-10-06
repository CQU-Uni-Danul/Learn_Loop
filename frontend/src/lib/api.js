// Base URL for the backend API
const apiBase = import.meta.env.VITE_API_BASE || "http://localhost:8000";

/**
 * apiFetch
 * - Adds JSON headers if body is not FormData
 * - Attaches Bearer token from sessionStorage
 * - Throws Error with readable message on non-2xx
 */

// Updated apiFetch function with better error logging
export async function apiFetch(path, options = {}) {
  const token = sessionStorage.getItem("accessToken");
  
  console.log("Token from sessionStorage:", token); // Debug log
  
  let headers = options.headers || {};

  if (!(options.body instanceof FormData)) {
    headers = {
      "Content-Type": "application/json",
      ...headers,
    };
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  console.log("Final headers being sent:", headers); // Debug log
  const res = await fetch(`${apiBase}${path}`, { ...options, headers });

  if (!res.ok) {
    let message = `API error (${res.status})`;
    let errorData = null;
    
    try {
      errorData = await res.json();
      console.error(`API Error ${res.status} for ${path}:`, errorData);
      
      if (errorData?.detail) {
        if (Array.isArray(errorData.detail)) {
          message = errorData.detail.map(e => `${e.loc?.join('.')}: ${e.msg}`).join(', ');
        } else if (typeof errorData.detail === 'object') {
          message = JSON.stringify(errorData.detail);
        } else {
          message = errorData.detail;
        }
      } else if (typeof errorData === "string") {
        message = errorData;
      } else {
        message = JSON.stringify(errorData);
      }
    } catch (jsonError) {
      console.error('Could not parse error response as JSON:', jsonError);
      message = `${res.status} ${res.statusText}`;
    }
    
    throw new Error(message);
  }

  if (res.status === 204) return null;
  return res.json();
}

/* ---------- USERS (read-only) ---------- */
export async function listUsers({ role, skip = 0, limit = 200 } = {}) {
  const params = new URLSearchParams();
  if (role) params.set("role", role);
  params.set("skip", String(skip));
  params.set("limit", String(limit));
  return apiFetch(`/api/users/?${params.toString()}`);
}

/* ---------- STUDENTS (CRUD) ---------- */
export async function createStudent(payload) {
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

/* ---------- TEACHERS (CRUD) ---------- */
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

/* ---------- TEACHER DASHBOARD ENDPOINTS ---------- */
export async function getProfile() {
  return apiFetch("/api/auth/me");
}

export async function getTodaySchedule() {
  return apiFetch("/api/teacher/schedule/me");
}

export async function getMaterials() {
  return apiFetch("/api/teacher/materials");
}

// src/lib/api.js
export async function uploadMaterial(formData) {
  // formData: { title, description?, subject?, target_grade, target_section?, file }
  return apiFetch('/api/materials', {
    method: 'POST',
    body: formData, // don't set Content-Type; browser sets multipart boundary
    headers: {}     // apiFetch will still add Authorization for you
  });
}

export async function listMyMaterials() {
  return apiFetch('/api/materials/mine');
}

export async function listMaterialsForMe() {
  return apiFetch('/api/materials/for-me');
}

export async function deleteMaterial(id) {
  return apiFetch(`/api/materials/${id}`, { method: 'DELETE' });
}


export async function sendMessage(content) {
  return apiFetch("/api/teacher/messages/send", {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

/* ---------- NOTIFICATIONS ---------- */
export async function sendNotification(content) {
  return apiFetch("/api/teacher/notifications/send", {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

export async function listNotifications() {
  return apiFetch("/api/teacher/notifications");
}


/* ---------- TIMETABLE (CRUD) ---------- */
export async function listTimetables({ teacher_id, student_id, day } = {}) {
  const params = new URLSearchParams();
  if (teacher_id) params.set("teacher_id", teacher_id);
  if (student_id) params.set("student_id", student_id);
  if (day) params.set("day", day);
  return apiFetch(`/api/timetable/?${params.toString()}`);
}

export async function createTimetable(payload) {
  return apiFetch("/api/timetable/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateTimetable(id, patch) {
  return apiFetch(`/api/timetable/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function deleteTimetable(id) {
  return apiFetch(`/api/timetable/${id}`, { method: "DELETE" });
}


export async function getStudentUnread() {
  return apiFetch("/api/students/notifications/unread");
}

// ---------- ADD THESE NAMED EXPORTS ----------
export async function chatStudent(message) {
  return apiFetch("/api/chat/student", {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}

export async function chatTeacher(message) {
  return apiFetch("/api/chat/teacher", {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}