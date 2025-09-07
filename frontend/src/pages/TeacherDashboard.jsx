import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

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
  const nav = useNavigate();
  const [me, setMe] = useState(null);
  const [today, setToday] = useState([]);
  const [loading, setLoading] = useState(true);
  const [materials, setMaterials] = useState([]);

  useEffect(() => {
    const token = sessionStorage.getItem("accessToken");
    const user = JSON.parse(sessionStorage.getItem("currentUser") || "null");
    if (!token || !user || user.role !== "teacher") { nav("/"); return; }

    (async () => {
      try {
        const profile = await api("/api/auth/me");
        setMe(profile);
        const sched = await api("/teacher/schedule/me");   // from backend router
        setToday(sched.today ?? []);
        const files = await api("/teacher/materials");
        setMaterials(files ?? []);
      } catch {
        nav("/");
      } finally {
        setLoading(false);
      }
    })();
  }, [nav]);

  const logout = () => {
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("currentUser");
    nav("/");
  };

  const handleUpload = async (file) => {
    if (!file) return;
    const body = new FormData();
    body.append("file", file);
    await fetch(`${import.meta.env.VITE_API_BASE || "http://localhost:8000"}/teacher/materials/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${sessionStorage.getItem("accessToken") || ""}` },
      body,
    });
    const files = await api("/teacher/materials");
    setMaterials(files ?? []);
    alert("Uploaded!");
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
              <h1 className="text-lg font-semibold text-slate-800">EduManage Pro • Teacher</h1>
              <p className="text-[11px] text-slate-500">Classes, attendance & materials</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {me && (
              <>
                <span className="hidden sm:inline text-sm text-slate-600">Welcome, {me.name.split(" ")[0]}</span>
                <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center text-sm font-semibold">
                  T
                </div>
              </>
            )}
            <button onClick={logout} className="btn btn-tch-outline">Logout</button>
          </div>
        </div>
      </header>

      {/* amber top line like admin/student */}
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
        </div>

        {/* Teaching materials */}
        <div className="tch-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="tch-chip">📚 Materials</div>
            <button
              onClick={async () => {
                const files = await api("/teacher/materials");
                setMaterials(files ?? []);
              }}
              className="btn btn-tch-outline"
            >
              Refresh
            </button>
          </div>

          <form
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleUpload(f);
            }}
          >
            <label className="block w-full cursor-pointer">
              <span className="btn btn-tch inline-block">Upload Material</span>
              <input type="file" className="hidden" />
            </label>
          </form>

          {materials.length > 0 ? (
            <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
              {materials.map((m) => <li key={m}>{m}</li>)}
            </ul>
          ) : (
            <p className="text-xs text-slate-500">No materials uploaded yet.</p>
          )}
        </div>

        {/* Quick actions */}
        <div className="tch-card p-4 flex flex-wrap gap-3">
          <button className="btn btn-tch">Start Class</button>
          <button className="btn btn-tch-outline">Mark Attendance</button>
          <button className="btn btn-tch-outline">Create Assignment</button>
        </div>
      </main>
    </div>
  );
}
