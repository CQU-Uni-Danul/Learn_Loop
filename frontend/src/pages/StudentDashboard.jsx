import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api";

function DayCard({ day, items }) {
  return (
    <div className="stu-card p-4">
      <div className="text-sm font-semibold mb-2 text-slate-800">{day}</div>
      {items && items.length > 0 ? (
        items.map((cls, i) => (
          <div key={i} className="text-xs text-slate-700 p-2 rounded border-l-2 border-emerald-400 mb-2 bg-emerald-50">
            <div className="font-medium">{cls.start} – {cls.end}</div>
            <div>{cls.subject}</div>
            <div className="text-slate-500">({cls.teacher})</div>
          </div>
        ))
      ) : (
        <div className="text-xs text-slate-400">No classes</div>
      )}
    </div>
  );
}

function StudentDashboard() {
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [week, setWeek] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("currentUser") || "null");
    const token = sessionStorage.getItem("accessToken");

    if (!token || !user) {
      navigate("/");
      return;
    }
    if (user.role !== "student") {
      navigate("/");
      return;
    }

    (async () => {
      try {
        const profile = await apiFetch("/api/auth/me");
        setMe(profile);

        const timetable = await apiFetch(`/api/student/timetable/${profile.id}`);
        setWeek(timetable.week ?? []);
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

  const nextClass = week?.find((d) => d.items?.length)?.items?.[0] || null;

  return (
    <div className="min-h-dvh bg-gradient-to-b from-emerald-50 to-emerald-100/50 p-4">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow">
              🎒
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-800">
                LearnLoop • Student
              </h1>
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
      {loading ? (
        <div className="stu-card p-4 text-sm text-slate-500 max-w-6xl mx-auto mt-6">Loading…!</div>
      ) : (
        <main className="max-w-6xl mx-auto px-4 py-6 space-y-5">


          {/* Next Class
          {nextClass && (
            <div className="stu-card p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-lg">⏰</div>
                  <div>
                    <div className="text-lg font-semibold text-blue-900">{nextClass.subject}</div>
                    <div className="text-sm text-blue-700">with {nextClass.teacher}</div>
                  </div>
                </div>
                <div className="text-right text-blue-600 font-medium">
                  {nextClass.start} – {nextClass.end}
                </div>
              </div>
            </div>
          )} */}


        {/* Next Class Card */}
{nextClass && (
  <div className="stu-card p-6 md:p-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 shadow-lg">
    
    {/* Icon */}
    <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-lg md:text-xl font-bold">
      ⏰
    </div>

    {/* Class Info */}
    <div className="flex-1">
      <h3 className="text-sm md:text-base text-blue-700">
        Next Class
      </h3>
      <p className="text-base md:text-lg font-semibold text-blue-900">
        {nextClass.subject} with {nextClass.teacher}
      </p>
      
    </div>

    {/* Room */}
    <div className="ml-auto text-right text-sm md:text-base">
      <div className="text-blue-600 font-medium">Room 204</div>
      <div className="stu-time">{nextClass.start} – {nextClass.end}</div>
    </div>
  </div>
)}






          {/* Weekly Timetable */}
           {/* Timetable Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {week.map((d) => (
              <DayCard key={d.day} day={d.day} items={d.items} />
            ))}
          </div>

          {/* Quick Actions */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Grades */}
            <div
              className="action-card relative p-6 cursor-pointer rounded-xl bg-gradient-to-br from-white to-slate-50 border border-slate-200 overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1"
              onClick={() => alert("View Grades")}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="icon-container w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center text-xl shadow-lg">
                  📊
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">A-</div>
                  <div className="text-xs text-slate-500">Current GPA</div>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-1">View Grades</h3>
              <p className="text-sm text-slate-600 mb-2">Check your academic progress and detailed scores</p>
              <div className="h-1 bg-blue-500 rounded-full w-4/5"></div>
            </div>

            {/* Assignments */}
            <div
              className="action-card relative p-6 cursor-pointer rounded-xl bg-gradient-to-br from-white to-slate-50 border border-slate-200 overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1"
              onClick={() => alert("View Assignments")}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="icon-container w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white flex items-center justify-center text-xl relative">
                  📝
                  <div className="absolute top-0 right-0 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-semibold animate-pulse">3</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">5</div>
                  <div className="text-xs text-slate-500">Due Soon</div>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-1">Assignments</h3>
              <p className="text-sm text-slate-600 mb-2">View upcoming tasks and submission deadlines</p>
              <div className="h-1 bg-green-500 rounded-full w-3/5"></div>
            </div>

            {/* Attendance */}
            <div
              className="action-card relative p-6 cursor-pointer rounded-xl bg-gradient-to-br from-white to-slate-50 border border-slate-200 overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1"
              onClick={() => alert("View Attendance")}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="icon-container w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white flex items-center justify-center text-xl">
                  ✅
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-purple-600">92%</div>
                  <div className="text-xs text-slate-500">This Semester</div>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-1">Attendance</h3>
              <p className="text-sm text-slate-600 mb-2">Track your presence and class participation</p>
              <div className="h-1 bg-purple-500 rounded-full w-11/12"></div>
            </div>
          </div>

          {/* Additional Quick Stats */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="stu-card p-4 text-center">12 <div className="text-xs text-slate-500">Total Courses</div></div>
            <div className="stu-card p-4 text-center">8 <div className="text-xs text-slate-500">Completed</div></div>
            <div className="stu-card p-4 text-center">24 <div className="text-xs text-slate-500">Credits</div></div>
            <div className="stu-card p-4 text-center">3.7 <div className="text-xs text-slate-500">Overall GPA</div></div>
          </div>
        </main>
      )}
    </div>
  );
}

export default StudentDashboard;
