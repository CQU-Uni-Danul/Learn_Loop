import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import RegisterUserForm from "../components/admin/RegisterUserForm";
import {
  listUsers,
  listStudents,
  updateStudent,
  deleteStudent,
  listTeachers,
  updateTeacher,
  deleteTeacher,
} from "../lib/api";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState(null);

  // --- student edit modal state ---
  const [editStudentOpen, setEditStudentOpen] = useState(false);
  const [editStudentLoading, setEditStudentLoading] = useState(false);
  const [editStudentErr, setEditStudentErr] = useState(null);
  const [editStudentForm, setEditStudentForm] = useState({
    id: null, name: "", email: "", grade: "", klass: "", password: "",
  });

  // --- teacher edit modal state ---
  const [editTeacherOpen, setEditTeacherOpen] = useState(false);
  const [editTeacherLoading, setEditTeacherLoading] = useState(false);
  const [editTeacherErr, setEditTeacherErr] = useState(null);
  const [editTeacherForm, setEditTeacherForm] = useState({
    id: null, name: "", email: "", subject: "", department: "", employee_code: "", phone: "", password: "",
  });

  // Guard: only allow admin with token
  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("currentUser") || "null");
    const token = sessionStorage.getItem("accessToken");
    if (!user || user.role !== "admin" || !token) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const refreshUsers = useCallback(async () => {
    try {
      setLoadingUsers(true);
      setError(null);
      const data = await listUsers();
      setUsers(data || []);
    } catch (err) {
      setError(err?.message || "Failed to load users");
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    refreshUsers();
  }, [refreshUsers]);

  const stats = useMemo(() => {
    const students = users.filter(u => u.role === "student").length;
    const teachers = users.filter(u => u.role === "teacher").length;
    const staff    = users.filter(u => u.role === "staff").length;
    return { students, teachers, staff, total: users.length };
  }, [users]);

  function logout() {
    sessionStorage.removeItem("currentUser");
    sessionStorage.removeItem("accessToken");
    navigate("/", { replace: true });
  }

  const onRegisterSuccess = () => {
    setActiveTab("users");
    refreshUsers();
  };

  // -------- Helpers to find student/teacher by email (for edit/delete) --------
  async function findStudentByEmail(email) {
    const res = await listStudents({ q: email, limit: 1 });
    if (!res || !res.length) throw new Error("Student record not found");
    return res[0];
  }
  async function findTeacherByEmail(email) {
    const res = await listTeachers({ q: email, limit: 1 });
    if (!res || !res.length) throw new Error("Teacher record not found");
    return res[0];
  }

  // -------- Edit handlers --------
  async function onEditClick(user) {
    if (user.role === "student") {
      try {
        setEditStudentErr(null);
        const s = await findStudentByEmail(user.email);
        setEditStudentForm({
          id: s.id,
          name: s.full_name || user.name || "",
          email: s.email || user.email || "",
          grade: s.grade || "",
          klass: s.class || "",
          password: "",
        });
        setEditStudentOpen(true);
      } catch (err) {
        setError(err?.message || "Failed to open student edit");
      }
    } else if (user.role === "teacher") {
      try {
        setEditTeacherErr(null);
        const t = await findTeacherByEmail(user.email);
        setEditTeacherForm({
          id: t.id,
          name: t.full_name || user.name || "",
          email: t.email || user.email || "",
          subject: t.subject || "",
          department: t.department || "",
          employee_code: t.employee_code || "",
          phone: t.phone || "",
          password: "",
        });
        setEditTeacherOpen(true);
      } catch (err) {
        setError(err?.message || "Failed to open teacher edit");
      }
    }
  }

  // -------- Delete handlers --------
  async function onDeleteClick(user) {
    if (user.role === "student") {
      const ok = window.confirm(`Delete student "${user.name}"? This also removes the linked login.`);
      if (!ok) return;
      try {
        const s = await findStudentByEmail(user.email);
        await deleteStudent(s.id);
        await refreshUsers();
      } catch (err) {
        setError(err?.message || "Delete failed");
      }
    } else if (user.role === "teacher") {
      const ok = window.confirm(`Delete teacher "${user.name}"? This also removes the linked login.`);
      if (!ok) return;
      try {
        const t = await findTeacherByEmail(user.email);
        await deleteTeacher(t.id);
        await refreshUsers();
      } catch (err) {
        setError(err?.message || "Delete failed");
      }
    }
  }

  // -------- Submit student edit --------
  async function submitStudentEdit(e) {
    e.preventDefault();
    setEditStudentLoading(true);
    setEditStudentErr(null);
    try {
      const patch = {
        full_name: editStudentForm.name,
        email: editStudentForm.email,
        grade: editStudentForm.grade || null,
        class: editStudentForm.klass, // API expects "class"
      };
      if (editStudentForm.password.trim()) patch.password = editStudentForm.password.trim();
      await updateStudent(editStudentForm.id, patch);
      setEditStudentOpen(false);
      await refreshUsers();
    } catch (err) {
      setEditStudentErr(err?.message || "Update failed");
    } finally {
      setEditStudentLoading(false);
    }
  }

  // -------- Submit teacher edit --------
  function normalizePhoneAU(raw) {
    if (!raw) return null;
    return String(raw).replace(/[()\s-]/g, "");
  }
  async function submitTeacherEdit(e) {
    e.preventDefault();
    setEditTeacherLoading(true);
    setEditTeacherErr(null);
    try {
      const patch = {
        full_name: editTeacherForm.name,
        email: editTeacherForm.email,
        subject: editTeacherForm.subject || null,
        department: editTeacherForm.department || null,
        employee_code: editTeacherForm.employee_code || null,
        phone: normalizePhoneAU(editTeacherForm.phone),
      };
      if (editTeacherForm.password.trim()) patch.password = editTeacherForm.password.trim();
      await updateTeacher(editTeacherForm.id, patch);
      setEditTeacherOpen(false);
      await refreshUsers();
    } catch (err) {
      setEditTeacherErr(err?.message || "Update failed");
    } finally {
      setEditTeacherLoading(false);
    }
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-lg border-b-4 border-indigo-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">📚</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">LearnLoop</h1>
                <p className="text-sm text-gray-600">School Management System</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:block text-sm text-gray-600">Welcome, Admin</span>
              <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">A</span>
              </div>
              <button onClick={logout} className="ml-2 px-3 py-1.5 rounded-md text-sm font-medium bg-gray-100 hover:bg-gray-200">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <nav className="flex space-x-1 bg-white rounded-lg p-1 shadow-md mb-8">
          {[
            { key: "dashboard", label: "📊 Dashboard" },
            { key: "users",     label: "👥 User Management" },
            { key: "register",  label: "➕ Register User" },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-6 py-3 rounded-md text-sm font-medium transition-all duration-200
                          ${activeTab === t.key ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {/* Dashboard */}
        {activeTab === "dashboard" && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard title="Total Students" value={stats.students} color="blue"   icon="🎓" />
              <StatCard title="Total Teachers" value={stats.teachers} color="green"  icon="👨‍🏫" />
              <StatCard title="Total Staff"    value={stats.staff}    color="purple" icon="👥" />
              <StatCard title="Total Users"    value={stats.total}    color="orange" icon="📊" />
            </div>
          </div>
        )}

        {/* Users (live) */}
        {activeTab === "users" && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
            </div>

            {error && <div className="text-sm rounded-md px-3 py-2 bg-red-50 text-red-700 mb-4">{error}</div>}
            {loadingUsers ? (
              <div className="text-gray-600">Loading users...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-indigo-100 rounded-full grid place-items-center">
                              <span className="text-indigo-600 font-semibold">{initials(u.name)}</span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{u.name}</div>
                              <div className="text-xs text-gray-500">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${badgeFor(u.role)}`}>
                            {u.role[0].toUpperCase() + u.role.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {(u.role === "student" || u.role === "teacher") ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => onEditClick(u)}
                                className="px-3 py-1.5 rounded-md text-sm bg-blue-600 text-white hover:bg-blue-700"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => onDeleteClick(u)}
                                className="px-3 py-1.5 rounded-md text-sm bg-red-600 text-white hover:bg-red-700"
                              >
                                Delete
                              </button>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Register */}
        {activeTab === "register" && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <RegisterUserForm onSuccess={onRegisterSuccess} />
          </div>
        )}
      </div>

      {/* Edit Student Modal */}
      {editStudentOpen && (
        <div className="fixed inset-0 bg-black/30 grid place-items-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Edit Student</h3>
              <button className="text-gray-500 hover:text-gray-700" onClick={() => setEditStudentOpen(false)}>✕</button>
            </div>

            <form onSubmit={submitStudentEdit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Full Name">
                  <input value={editStudentForm.name} onChange={(e) => setEditStudentForm(f => ({ ...f, name: e.target.value }))} className="w-full rounded-lg border px-3 py-2" required />
                </Field>
                <Field label="Email">
                  <input type="email" value={editStudentForm.email} onChange={(e) => setEditStudentForm(f => ({ ...f, email: e.target.value }))} className="w-full rounded-lg border px-3 py-2" required />
                </Field>
                <Field label="Grade">
                  <input value={editStudentForm.grade} onChange={(e) => setEditStudentForm(f => ({ ...f, grade: e.target.value }))} className="w-full rounded-lg border px-3 py-2" placeholder="e.g., 8" />
                </Field>
                <Field label="Class">
                  <input value={editStudentForm.klass} onChange={(e) => setEditStudentForm(f => ({ ...f, klass: e.target.value }))} className="w-full rounded-lg border px-3 py-2" required />
                </Field>
                <Field label="New Password (optional)">
                  <input type="password" value={editStudentForm.password} onChange={(e) => setEditStudentForm(f => ({ ...f, password: e.target.value }))} className="w-full rounded-lg border px-3 py-2" placeholder="Leave blank to keep current password" />
                </Field>
              </div>

              {editStudentErr && <div className="text-sm rounded-md px-3 py-2 bg-red-50 text-red-700">{editStudentErr}</div>}

              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setEditStudentOpen(false)} className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200">Cancel</button>
                <button type="submit" disabled={editStudentLoading} className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60">
                  {editStudentLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Teacher Modal */}
      {editTeacherOpen && (
        <div className="fixed inset-0 bg-black/30 grid place-items-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Edit Teacher</h3>
              <button className="text-gray-500 hover:text-gray-700" onClick={() => setEditTeacherOpen(false)}>✕</button>
            </div>

            <form onSubmit={submitTeacherEdit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Full Name">
                  <input value={editTeacherForm.name} onChange={(e) => setEditTeacherForm(f => ({ ...f, name: e.target.value }))} className="w-full rounded-lg border px-3 py-2" required />
                </Field>
                <Field label="Email">
                  <input type="email" value={editTeacherForm.email} onChange={(e) => setEditTeacherForm(f => ({ ...f, email: e.target.value }))} className="w-full rounded-lg border px-3 py-2" required />
                </Field>
                <Field label="Subject">
                  <input value={editTeacherForm.subject} onChange={(e) => setEditTeacherForm(f => ({ ...f, subject: e.target.value }))} className="w-full rounded-lg border px-3 py-2" placeholder="e.g., Math" />
                </Field>
                <Field label="Department">
                  <input value={editTeacherForm.department} onChange={(e) => setEditTeacherForm(f => ({ ...f, department: e.target.value }))} className="w-full rounded-lg border px-3 py-2" placeholder="e.g., Science" />
                </Field>
                <Field label="Employee Code">
                  <input value={editTeacherForm.employee_code} onChange={(e) => setEditTeacherForm(f => ({ ...f, employee_code: e.target.value }))} className="w-full rounded-lg border px-3 py-2" placeholder="e.g., TCH001" />
                </Field>
                <Field label="Phone (AU +61)">
                  <input
                    type="tel"
                    value={editTeacherForm.phone}
                    onChange={(e) => setEditTeacherForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2"
                    placeholder="+61412345678"
                    pattern="^\+61\d{9}$"
                    title="Must be +61 followed by 9 digits (e.g., +61412345678)"
                  />
                </Field>
                <Field label="New Password (optional)" wide>
                  <input type="password" value={editTeacherForm.password} onChange={(e) => setEditTeacherForm(f => ({ ...f, password: e.target.value }))} className="w-full rounded-lg border px-3 py-2" placeholder="Leave blank to keep current password" />
                </Field>
              </div>

              {editTeacherErr && <div className="text-sm rounded-md px-3 py-2 bg-red-50 text-red-700">{editTeacherErr}</div>}

              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setEditTeacherOpen(false)} className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200">Cancel</button>
                <button type="submit" disabled={editTeacherLoading} className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60">
                  {editTeacherLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- helpers ---------- */
function Field({ label, children }) {
  return (
    <div className="md:col-span-1">
      <label className="block text-sm font-medium mb-1">{label}</label>
      {children}
    </div>
  );
}
function initials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] || "").toUpperCase() + (parts[1]?.[0] || "").toUpperCase();
}
function badgeFor(role) {
  switch (role) {
    case "student": return "bg-blue-100 text-blue-800";
    case "teacher": return "bg-green-100 text-green-800";
    case "staff":   return "bg-purple-100 text-purple-800";
    case "admin":   return "bg-gray-200 text-gray-800";
    default:        return "bg-gray-100 text-gray-800";
  }
}
function StatCard({ title, value, color, icon }) {
  const border = { blue:"border-blue-500", green:"border-green-500", purple:"border-purple-500", orange:"border-orange-500" }[color];
  const bgIcon = { blue:"bg-blue-100 text-blue-600", green:"bg-green-100 text-green-600", purple:"bg-purple-100 text-purple-600", orange:"bg-orange-100 text-orange-600" }[color];
  return (
    <div className={`bg-white rounded-xl shadow-md p-6 border-l-4 ${border}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`w-12 h-12 ${bgIcon} rounded-lg grid place-items-center`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  );
}
