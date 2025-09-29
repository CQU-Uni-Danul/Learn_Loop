
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api";

export default function TimetablesPage() {
  const navigate = useNavigate();
  const [timetables, setTimetables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState(null);

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

        // const data = await apiFetch("/api/teacher/timetables");
        // setTimetables(data.timetables ?? []);
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

  const refreshTimetables = async () => {
    try {
      const data = await apiFetch("/api/teacher/timetables");
      setTimetables(data.timetables ?? []);
    } catch (err) {
      console.error("Failed to refresh:", err);
    }
  };

  const handleCreate = () => {
    navigate("/teacher/timetables/new");
  };


  return (
    <div className="min-h-dvh tch-bg">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/teacher')}
              className="text-slate-600 hover:text-slate-800"
            >
              ← Back 
            </button>
            <div className="w-9 h-9 rounded-xl bg-indigo-500 text-white flex items-center justify-center shadow">
              📅
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-800">All Timetables</h1>
              <p className="text-[11px] text-slate-500">Manage class schedules</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {me && (
              <>
                <span className="hidden sm:inline text-sm text-slate-600">Welcome, {me.name.split(" ")[0]}</span>
                <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center text-sm font-semibold">
                  T
                </div>
              </>
            )}
            <button onClick={logout} className="btn btn-tch-outline">Logout</button>
          </div>
        </div>
      </header>

      <div className="topline-tch" />

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="tch-card overflow-hidden">
          <div className="px-4 py-2.5 text-sm font-semibold bg-indigo-50 text-indigo-700 flex items-center justify-between">
            <span>Timetables ({timetables.length})</span>
            <div className="flex items-center gap-2">
              <button 
                onClick={refreshTimetables}
                className="text-xs px-2 py-1 bg-white rounded text-indigo-700 hover:bg-indigo-100"
              >
                Refresh
              </button>
              <button 
                onClick={handleCreate}
                className="text-xs px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                + Create
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-6 text-center text-slate-500">Loading timetables...</div>
          ) : timetables.length === 0 ? (
            <div className="p-6 text-center text-slate-500">
              <div className="text-4xl mb-2">📭</div>
              <p>No timetables found</p>
              <p className="text-xs mt-2">Click "Create" to add a new timetable</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {timetables.map((tt) => (
                <div key={tt.timetable_id} className="p-4 hover:bg-slate-50">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-slate-700">
                        {tt.class_name} — {tt.day_of_week}
                      </p>
                      <p className="text-xs text-slate-500">
                        {tt.start_time} - {tt.end_time}
                      </p>
                      <p className="text-xs text-slate-500">
                        Student: {tt.student_name} | Teacher: {tt.teacher_name}
                      </p>
                    </div>
                    {/* <button
                      onClick={() => handleEdit(tt.timetable_id)}
                      className="text-xs px-2 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600"
                    >
                      Edit
                    </button> */}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
