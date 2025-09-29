import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api";

export default function TimetablesPage() {
  const navigate = useNavigate();
  const [timetables, setTimetables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState(null);

  const [form, setForm] = useState({
    classId: "",
    studentId: "",
    dayOfWeek: "",
    startTime: "",
    endTime: "",
  });

  useEffect(() => {
  const token = sessionStorage.getItem("accessToken");
  const user = JSON.parse(sessionStorage.getItem("currentUser") || "null");
  if (!token || !user) {
    navigate("/");
    return;
  }

  (async () => {
    try {
      const profile = await apiFetch("/api/auth/me");
      setMe(profile);

      if (profile.role === "student") {
        // student can auto-load their timetable
        await refreshTimetables(profile.user_id);
      }
      // teachers: wait until they enter a studentId in form
    } catch (err) {
      console.error(err);
      navigate("/");
    } finally {
      setLoading(false);
    }
  })();
}, [navigate]);

  const logout = () => {
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("currentUser");
    navigate("/");
  };

  const refreshTimetables = async (studentId) => {
    try {
      const res = await apiFetch(`/api/timetable/${studentId}`);
      setTimetables(res.week ?? []);
    } catch (err) {
      console.error("Failed to refresh:", err);
      setTimetables([]);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  if (!me) return;

  try {
    await apiFetch("/api/timetable", {
      method: "POST",
      body: JSON.stringify({
        class_id: parseInt(form.classId || "0", 10),
        student_id: parseInt(form.studentId || "0", 10),
        teacher_id: me.role === "teacher" 
          ? me.user_id 
          : parseInt(form.teacherId || "0", 10), // admin must provide
        day_of_week: form.dayOfWeek || "",
        start_time: form.startTime || "",
        end_time: form.endTime || "",
      }),
    });

      setForm({
        classId: "",
        studentId: "",
        dayOfWeek: "",
        startTime: "",
        endTime: "",
      });

      await refreshTimetables(form.studentId);

    } catch (err) {
      console.error("Failed to create timetable:", err);
    }
  };

    return (
    <div className="min-h-screen tch-bg">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/teacher")}
              className="text-slate-600 hover:text-slate-800 transition-colors"
            >
              ← Back
            </button>
            <div className="w-9 h-9 rounded-xl bg-indigo-500 text-white flex items-center justify-center shadow">
              📅
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-800">
                Manage Timetables
              </h1>
              <p className="text-xs text-slate-500">
                View, create, and organize schedules
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {me && (
              <>
                <span className="hidden sm:inline text-sm text-slate-600">
                  Welcome, {me.name.split(" ")[0]}
                </span>
                <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center text-sm font-semibold">
                  T
                </div>
              </>
            )}
            <button onClick={logout} className="btn btn-tch-outline">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="topline-tch" />

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="tch-card">
          {/* Toolbar */}
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              📖 Timetable List
            </h2>
            <button
              onClick={refreshTimetables}
              className="btn-secondary text-xs"
            >
              🔄 Refresh
            </button>
          </div>

          {/* Loading / Empty / Table */}
          {loading ? (
            <div className="p-6 text-center text-slate-500">
              Loading timetables...
            </div>
          ) : timetables.length === 0 ? (
            <div className="p-6 text-center text-slate-500">
              <div className="text-4xl mb-2">📭</div>
              <p>No timetables found</p>
              <p className="text-xs mt-2">
                Use the form below to add a new timetable
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left border border-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 border">Class</th>
                    <th className="px-4 py-2 border">Day</th>
                    <th className="px-4 py-2 border">Time</th>
                    <th className="px-4 py-2 border">Student</th>
                    <th className="px-4 py-2 border">Teacher</th>
                  </tr>
                </thead>
                <tbody>
                  {timetables.map((tt) => (
                    <tr
                      key={tt.timetable_id}
                      className="hover:bg-slate-50 transition"
                    >
                      <td className="px-4 py-2 border">{tt.class_name}</td>
                      <td className="px-4 py-2 border">{tt.day_of_week}</td>
                      <td className="px-4 py-2 border">
                        {tt.start_time} - {tt.end_time}
                      </td>
                      <td className="px-4 py-2 border">{tt.student_name}</td>
                      <td className="px-4 py-2 border">{tt.teacher_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Form to create new timetable */}
          <div className="p-6 border-t border-slate-200">
            <h3 className="text-md font-semibold mb-3">➕ Create New Timetable</h3>
            <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
              <input
                type="text"
                name="className"
                placeholder="Class Name"
                value={form.className}
                onChange={handleChange}
                className="input"
                required
              />
              <input
                type="number"
                name="studentId"
                placeholder="Student ID"
                value={form.studentId}
                onChange={handleChange}
                className="input"
                required
              />
              <input
                type="number"
                name="teacherId"
                placeholder="Teacher ID"
                value={form.teacherId}
                onChange={handleChange}
                className="input"
                required
              />
              <select
                name="dayOfWeek"
                value={form.dayOfWeek}
                onChange={handleChange}
                className="input"
                required
              >
                <option value="">Select Day</option>
                <option value="Monday">Monday</option>
                <option value="Tuesday">Tuesday</option>
                <option value="Wednesday">Wednesday</option>
                <option value="Thursday">Thursday</option>
                <option value="Friday">Friday</option>
              </select>
              <input
                type="time"
                name="startTime"
                value={form.startTime}
                onChange={handleChange}
                className="input"
                required
              />
              <input
                type="time"
                name="endTime"
                value={form.endTime}
                onChange={handleChange}
                className="input"
                required
              />
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  className="btn-primary w-full py-2 mt-2"
                >
                  Save Timetable
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}