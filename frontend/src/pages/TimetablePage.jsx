import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export default function TimetablePage() {
  const navigate = useNavigate();
  const [timetable, setTimetable] = useState([]);
  const [newEntry, setNewEntry] = useState({ subject: '', section: '', time: '' });
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(sessionStorage.getItem("currentUser") || "null");

  useEffect(() => {
    if (!sessionStorage.getItem("accessToken")) { navigate("/"); return; }

    (async () => {
      try {
        const sched = await api(`/${user.role}/timetable`);
        setTimetable(sched ?? []);
      } catch {
        navigate("/");
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate, user.role]);

  const addEntry = async () => {
    if (user.role !== 'teacher') return;
    await api("/teacher/timetable/add", { method: "POST", body: JSON.stringify(newEntry) });
    const sched = await api("/teacher/timetable");
    setTimetable(sched ?? []);
    setNewEntry({ subject: '', section: '', time: '' });
    alert("Added! Pending admin approval.");
  };

  const approve = async (id) => {
    if (user.role !== 'admin') return;
    await api(`/admin/approve-timetable/${id}`, { method: "POST" });
    const sched = await api("/admin/timetable");
    setTimetable(sched ?? []);
  };

  return (
    <div className="min-h-dvh tch-bg"> {/* Adapt based on role */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <h1 className="text-lg font-semibold">Timetable Management</h1>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="tch-card p-4 space-y-3">
          <div className="tch-chip">⏰ Timetable</div>
          {loading ? <p>Loading...</p> : (
            <ul className="space-y-2">
              {timetable.map((t, i) => (
                <li key={i} className="flex justify-between">
                  {t.subject} - {t.section} - {t.time}
                  {user.role === 'admin' && t.pending && <button onClick={() => approve(t.id)} className="btn btn-tch">Approve</button>}
                </li>
              ))}
            </ul>
          )}
          {user.role === 'teacher' && (
            <div className="space-y-2">
              <input
                value={newEntry.subject}
                onChange={(e) => setNewEntry({ ...newEntry, subject: e.target.value })}
                placeholder="Subject"
                className="w-full p-2 border"
              />
              <input
                value={newEntry.section}
                onChange={(e) => setNewEntry({ ...newEntry, section: e.target.value })}
                placeholder="Section"
                className="w-full p-2 border"
              />
              <input
                value={newEntry.time}
                onChange={(e) => setNewEntry({ ...newEntry, time: e.target.value })}
                placeholder="Time"
                className="w-full p-2 border"
              />
              <button onClick={addEntry} className="btn btn-tch">Add Entry</button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}