import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

function DayCard({ day, items }) {
  return (
    <div className="stu-card overflow-hidden">
      <div className="px-4 py-2.5 bg-emerald-50 text-[13px] font-semibold text-emerald-700">
        {day}
      </div>
      <div>
        {items.map((it, idx) => (
          <div
            key={idx}
            className="stu-row flex items-center justify-between px-4 py-3 border-t first:border-t-0 border-slate-200"
          >
            <div className="text-[13px]">
              <div className="font-medium text-slate-900">{it.subject}</div>
              <div className="text-slate-500 text-xs">{it.teacher}</div>
            </div>
            <div className="stu-time">{it.start} – {it.end}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StudentDashboard() {
  const nav = useNavigate();
  const [me, setMe] = useState(null);
  const [week, setWeek] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem("accessToken");
    const user = JSON.parse(sessionStorage.getItem("currentUser") || "null");
    if (!token || !user) { nav("/"); return; }
    if (user.role !== "student") { nav("/"); return; }

    (async () => {
      try {
        const profile = await api("/api/auth/me");
        setMe(profile);
        // const timetable = await api(`/timetable/${profile.id}`);
        // console.log(timetable.week);
        // setWeek(timetable.week ?? []);

        const timetable = await api(`/student/timetable/${profile.id}`);
        console.log(timetable.week);
        setWeek(timetable.week ?? []);

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

  const nextClass =
    week?.find(d => d.items?.length)?.items?.[0] || null;

  return (
    <div className="min-h-dvh bg-gradient-to-b from-emerald-50 to-emerald-100/50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow">
              🎒
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-800">LearnLoop • Student</h1>
              <p className="text-[11px] text-slate-500">My classes & schedule</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {me && (
              <>
                <span className="hidden sm:inline text-sm text-slate-600">
                  Welcome, {me.name.split(" ")[0]}
                </span>
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm font-semibold">
                  S
                </div>
              </>
            )}
            <button
              onClick={logout}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Green line */}
      <div className="h-1 bg-emerald-600"></div>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-5">
        {/* Section header card */}
        <div className="stu-card p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="stu-chip inline-flex items-center gap-1">
              <span>📅</span> Weekly Timetable
            </span>
            {me && (
              <span className="text-xs text-slate-500">
                {me.name} • <span className="text-slate-400">{me.email}</span>
              </span>
            )}
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <button className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 hover:bg-slate-50">
              This Week
            </button>
            <button className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 hover:bg-slate-50">
              Next Week
            </button>
          </div>
        </div>

        {/* Next class card */}
        {nextClass && (
          <div className="stu-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                ⏰
              </div>
              <div>
                <div className="text-sm font-medium text-slate-800">Next up: {nextClass.subject}</div>
                <div className="text-xs text-slate-500">with {nextClass.teacher}</div>
              </div>
            </div>
            <div className="stu-time">{nextClass.start} – {nextClass.end}</div>
          </div>
        )}

        {/* Timetable grid */}
        {loading ? (
          <div className="stu-card p-4 text-sm text-slate-500">Loading…!</div>
        ) : week.length === 0 ? (
          <div className="stu-card p-4 text-sm text-slate-500">No classes found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            
            {week.map((d) => (
              <DayCard key={d.day} day={d.day} items={d.items} />
            ))}
          </div>
        )}

        {/* Quick actions */}
        <div className="stu-card p-4 flex flex-wrap items-center gap-3">
          <button className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition">
            Join Class
          </button>
          <button className="px-4 py-2 rounded-lg border border-emerald-600 text-emerald-700 text-sm font-medium hover:bg-emerald-50 transition">
            Messages
          </button>
          <button className="px-4 py-2 rounded-lg border border-emerald-600 text-emerald-700 text-sm font-medium hover:bg-emerald-50 transition">
            Attendance
          </button>
        </div>
      </main>
    </div>
  );
}