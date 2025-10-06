// frontend/src/pages/TeacherDashboard.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api"; // Must add JWT Authorization header for you
import ChatbotWidget from "../components/admin/ChatbotWidget";

/* small stat card */
function Stat({ label, value }) {
  return (
    <div className="tch-card p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-slate-800">{value}</div>
    </div>
  );
}

/* one class row */
function ClassRow({ subject, section, time }) {
  return (
    <div className="tch-row flex items-center justify-between px-3 py-2 border-t first:border-t-0 border-slate-200">
      <div>
        <div className="text-sm font-medium text-slate-800">{subject}</div>
        <div className="text-xs text-slate-500">{section}</div>
      </div>
      <div className="tch-time">{time}</div>
    </div>
  );
}

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [today, setToday] = useState([]);
  const [loading, setLoading] = useState(true);

  // Materials state
  const [materials, setMaterials] = useState([]);
  const [title, setTitle] = useState("");
  const [grade, setGrade] = useState("");
  const [section, setSection] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const fileRef = useRef(null);

  // Notifications state
  const [notification, setNotification] = useState("");
  const [notificationsList, setNotificationsList] = useState([]);

  const API_BASE = import.meta?.env?.VITE_API_BASE || "http://localhost:8000";
  const fileUrl = (p) => {
    if (!p) return "#";
    // If backend saved an absolute URL (S3, etc), just return it
    if (/^https?:\/\//i.test(p)) return p;
    // If it's a local path like "uploads/materials/xxx.pdf" or "/uploads/materials/xxx.pdf"
    const path = p.startsWith("/") ? p : `/${p}`;
    return `${API_BASE}${path}`;
  };

  // Load profile, schedule, and initial materials list
  useEffect(() => {
    const token = sessionStorage.getItem("accessToken");
    const user = JSON.parse(sessionStorage.getItem("currentUser") || "null");
    if (!token || !user || user.role !== "teacher") {
      navigate("/");
      return;
    }

    (async () => {
      try {
        const profile = await apiFetch("/api/auth/me");
        setMe(profile);

        // Keep your existing schedule endpoint; change if you later move it
        const sched = await apiFetch("/api/teacher/schedule/me");
        setToday(sched.schedule ?? []);

        await refreshMaterials();
      } catch (err) {
        console.error(err);
        navigate("/");
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  const refreshMaterials = async () => {
    try {
      const list = await apiFetch("/api/materials/mine");
      setMaterials(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error("Failed to load materials:", e);
      setMaterials([]);
    }
  };

  const logout = () => {
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("currentUser");
    navigate("/");
  };

  // Upload handler using FormData (title, grade, section?, description?, subject?, file)
  const handleUploadMaterial = async (e) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!title.trim() || !grade.trim() || !file) {
      alert("Please provide Title, Grade, and a File.");
      return;
    }
    try {
      const fd = new FormData();
      fd.append("title", title.trim());
      fd.append("target_grade", grade.trim());
      if (section.trim()) fd.append("target_section", section.trim());
      if (description.trim()) fd.append("description", description.trim());
      if (subject.trim()) fd.append("subject", subject.trim());
      fd.append("file", file);

      await apiFetch("/api/materials", {
        method: "POST",
        body: fd, // IMPORTANT: do not set Content-Type; browser sets multipart boundary
      });

      // Reset form
      setTitle("");
      setGrade("");
      setSection("");
      setDescription("");
      setSubject("");
      if (fileRef.current) fileRef.current.value = "";

      await refreshMaterials();
      alert("Material uploaded!");
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed. Check console for details.");
    }
  };

  const deleteMaterial = async (id) => {
    if (!window.confirm("Delete this material?")) return;
    try {
      await apiFetch(`/api/materials/${id}`, { method: "DELETE" });
      await refreshMaterials();
    } catch (e) {
      console.error("Delete failed:", e);
      alert("Failed to delete material.");
    }
  };

  const sendNotification = async () => {
    if (!notification) return;
    try {
      await apiFetch("/api/teacher/notifications/send", {
        method: "POST",
        body: JSON.stringify({ content: notification }),
      });
      setNotification("");
      alert("Notification sent!");
    } catch (err) {
      console.error("Notification send error:", err);
      alert(`Failed to send notification: ${err.message}`);
    }
  };

  return (
    <div className="min-h-dvh tch-bg">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow">
              🍎
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-800">LearnLoop • Teacher</h1>
              <p className="text-[11px] text-slate-500">Classes, attendance & materials</p>
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
            <button onClick={logout} className="btn btn-tch-outline">Logout</button>
          </div>
        </div>
      </header>

      <div className="topline-tch" />

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Stat label="Classes Today" value={today.length} />
          <Stat label="Pending Assignments" value="4" />
          <Stat label="Absent Alerts" value="2" />
        </div>

        {/* Today’s classes */}
        <div className="tch-card overflow-hidden">
          <div className="px-4 py-2.5 text-sm font-semibold bg-[rgb(255_251_235)] text-[rgb(217_119_6)]">
            Today’s Classes
          </div>
          {loading ? (
            <div className="p-4 text-sm text-slate-500">Loading…</div>
          ) : today.length === 0 ? (
            <div className="p-4 text-sm text-slate-500">No classes scheduled.</div>
          ) : (
            today.map((c, i) => (
              <ClassRow key={i} subject={c.subject} section={c.section} time={c.time} />
            ))
          )}
          <button onClick={() => navigate('/timetable')} className="btn btn-tch-outline m-4">
            Create / Edit Timetable
          </button>
        </div>

        {/* Materials */}
        <div className="tch-card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="tch-chip">📚 Materials</div>
            <div className="flex gap-2">
              <button
                onClick={refreshMaterials}
                className="btn btn-tch-outline"
              >
                Refresh
              </button>
              <button onClick={() => navigate('/materials')} className="btn btn-tch-outline">
                View All Materials
              </button>
            </div>
          </div>

          {/* Upload form */}
          <form onSubmit={handleUploadMaterial} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex flex-col">
              <label className="text-xs text-slate-600 mb-1">Title*</label>
              <input
                className="border border-slate-300 rounded px-2 py-1"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Algebra Worksheet 1"
                required
              />
            </div>

            <div className="flex flex-col">
              <label className="text-xs text-slate-600 mb-1">Grade*</label>
              <input
                className="border border-slate-300 rounded px-2 py-1"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="e.g., 8 or Grade 8"
                required
              />
            </div>

            <div className="flex flex-col">
              <label className="text-xs text-slate-600 mb-1">Section (optional)</label>
              <input
                className="border border-slate-300 rounded px-2 py-1"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                placeholder="e.g., A"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-xs text-slate-600 mb-1">Subject (optional)</label>
              <input
                className="border border-slate-300 rounded px-2 py-1"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Defaults to your teacher subject"
              />
            </div>

            <div className="md:col-span-2 flex flex-col">
              <label className="text-xs text-slate-600 mb-1">Description (optional)</label>
              <textarea
                className="border border-slate-300 rounded px-2 py-1"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short notes for students"
              />
            </div>

            <div className="md:col-span-2 flex items-center gap-3">
              <input ref={fileRef} type="file" className="border border-slate-300 rounded px-2 py-1" />
              <button type="submit" className="btn btn-tch">Upload</button>
            </div>
          </form>

          {/* List my uploads */}
          {materials.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-slate-200">
                    <th className="py-2 pr-4">Title</th>
                    <th className="py-2 pr-4">Subject</th>
                    <th className="py-2 pr-4">Grade</th>
                    <th className="py-2 pr-4">Section</th>
                    <th className="py-2 pr-4">Created</th>
                    <th className="py-2 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {materials.map((m) => (
                    <tr key={m.id} className="border-b border-slate-100">
                      <td className="py-2 pr-4">
                        <a className="text-amber-700 underline" href={fileUrl(m.file_path)} target="_blank" rel="noreferrer">
                          {m.title}
                        </a>
                        {m.description ? (
                          <div className="text-xs text-slate-500">{m.description}</div>
                        ) : null}
                      </td>
                      <td className="py-2 pr-4">{m.subject || "—"}</td>
                      <td className="py-2 pr-4">{m.target_grade}</td>
                      <td className="py-2 pr-4">{m.target_section || "All"}</td>
                      <td className="py-2 pr-4">
                        {m.created_at ? new Date(m.created_at).toLocaleString() : "—"}
                      </td>
                      <td className="py-2 pr-4">
                        <button className="btn btn-tch-outline" onClick={() => deleteMaterial(m.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-500">No materials uploaded yet.</p>
          )}
        </div>

        {/* Notifications */}
        <div className="tch-card p-4 space-y-3">
          <div className="tch-chip">🔔 Notifications</div>
          <textarea
            value={notification}
            onChange={(e) => setNotification(e.target.value)}
            placeholder="Notify students about assignments or events"
            className="w-full p-2 border border-slate-300 rounded"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault(); // prevent newline
                sendNotification();
              }
            }}
          />
          <button onClick={sendNotification} className="btn btn-tch">Send Notification</button>
          <button onClick={() => navigate('/notifications')} className="btn btn-tch-outline">
            View All Notifications
          </button>
        </div>

        {/* Quick actions */}
        <div className="tch-card p-4 flex flex-wrap gap-3">
          <button
            className="btn btn-tch"
            onClick={() => window.open("https://meet.google.com/owc-giuc-zjp", "_blank")}
          >
            Start Class
          </button>
          <button className="btn btn-tch-outline">Mark Attendance</button>
          <button className="btn btn-tch-outline">Create Assignment</button>
        </div>
      </main>

      <ChatbotWidget role="teacher" />
    </div>
  );
}
