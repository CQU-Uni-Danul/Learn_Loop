import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const apiBase = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [users, setUsers] = useState([
    { id: 1, firstName: "John",  lastName: "Doe",    email: "john.doe@school.edu",   role: "student", status: "active", grade: "11", studentId: "STU001" },
    { id: 2, firstName: "Jane",  lastName: "Smith",  email: "jane.smith@school.edu", role: "teacher", status: "active", subject: "Math", employeeId: "TCH001" },
    { id: 3, firstName: "Mike",  lastName: "Johnson",email: "mike.johnson@school.edu", role: "staff",  status: "active", department: "Admin", employeeId: "STF001" },
  ]);

  // Guard: only allow admin with token
  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("currentUser") || "null");
    const token = sessionStorage.getItem("accessToken");
    if (!user || user.role !== "admin" || !token) {
      navigate("/", { replace: true });
      return;
    }
    // Optional: verify token with backend
    // fetch(`${apiBase}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` }})
    //   .then(r => r.ok ? r.json() : Promise.reject())
    //   .catch(() => navigate("/", { replace: true }));
  }, [navigate]);

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
              <button
                onClick={logout}
                className="ml-2 px-3 py-1.5 rounded-md text-sm font-medium bg-gray-100 hover:bg-gray-200"
              >
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

            {/* Recent Activity (placeholder) */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-green-100 rounded-full grid place-items-center">
                    <span className="text-green-600 text-sm">✓</span>
                  </div>
                  New student registered: Sarah Johnson • 2 minutes ago
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 rounded-full grid place-items-center">
                    <span className="text-blue-600 text-sm">📝</span>
                  </div>
                  Teacher profile updated: Dr. Smith • 15 minutes ago
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-purple-100 rounded-full grid place-items-center">
                    <span className="text-purple-600 text-sm">👤</span>
                  </div>
                  New staff member added: Mike Wilson • 1 hour ago
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users */}
        {activeTab === "users" && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
              {/* filters/search could go here */}
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-indigo-100 rounded-full grid place-items-center">
                            <span className="text-indigo-600 font-semibold">
                              {u.firstName[0]}{u.lastName[0]}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{u.firstName} {u.lastName}</div>
                            <div className="text-xs text-gray-500">{u.studentId || u.employeeId || "N/A"}</div>
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
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          {u.status === "active" ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Register */}
        {activeTab === "register" && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Register New User</h3>
            <p className="text-gray-500">Hook this tab to your backend (e.g., POST /api/admin/users) when ready.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function badgeFor(role) {
  switch (role) {
    case "student":
      return "bg-blue-100 text-blue-800";
    case "teacher":
      return "bg-green-100 text-green-800";
    case "staff":
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function StatCard({ title, value, color, icon }) {
  const border = {
    blue: "border-blue-500",
    green: "border-green-500",
    purple: "border-purple-500",
    orange: "border-orange-500",
  }[color];

  const bgIcon = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600",
    orange: "bg-orange-100 text-orange-600",
  }[color];

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
