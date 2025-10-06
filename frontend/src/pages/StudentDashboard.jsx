
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api";

// Single day card component for timetable
function DayCard({ day, items }) {
  return (
    <div className="stu-card p-4">
      <div className="text-sm font-semibold mb-2 text-slate-800">{day}</div>
      {items && items.length > 0 ? (
        items.map((cls, i) => (
          <div
            key={i}
            className="text-xs text-slate-700 p-2 rounded border-l-2 border-emerald-400 mb-2 bg-emerald-50"
          >
            <div className="font-medium">
              {cls.start} – {cls.end}
            </div>
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




export default function StudentDashboard() {
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [week, setWeek] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(null); // 'grades' | 'assignments' | 'attendance' | null
  const [unreadCount, setUnreadCount] = useState(0); // 🔔 notifications

  

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

        const timetable = await apiFetch(`/api/timetable/${profile.id}`);
        setWeek(timetable.week ?? []);

        // 🔔 fetch unread notifications count
        const notifRes = await apiFetch("/api/students/notifications/unread");
        setUnreadCount(notifRes.unread ?? 0);
      } catch (err) {
        console.error(err);
        navigate("/");
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  const markAllRead = async () => {
  try {
    await apiFetch("/api/students/notifications/mark-read-not", { method: "POST" });
    setUnreadCount(0); // immediately reset the badge
  } catch (err) {
    console.error("Failed to mark notifications as read:", err);
  }
};

  const logout = () => {
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("currentUser");
    navigate("/");
  };



  const nextClass = week?.find((d) => d.items?.length)?.items?.[0] || null;

  // Dummy data for modals
  const gradesData = [
    { subject: "Mathematics", teacher: "Ms. Rodriguez", grade: "A-", percentage: "88%" },
    { subject: "Physics", teacher: "Mr. Wilson", grade: "B+", percentage: "85%" },
    { subject: "Chemistry", teacher: "Dr. Chen", grade: "A", percentage: "92%" },
    { subject: "English", teacher: "Mr. Thompson", grade: "B", percentage: "82%" },
  ];

  const assignmentsData = [
    { task: "Physics Lab Report", due: "Tomorrow", status: "In Progress" },
    { task: "Math Problem Set 5", due: "Friday", status: "Not Started" },
    { task: "Chemistry Quiz", due: "Next Monday", status: "Studying" },
    { task: "English Essay", due: "Next Week", status: "Planning" },
  ];

  const attendanceData = [
    { class: "Mathematics", attended: "12/13", percentage: "92%" },
    { class: "Physics", attended: "11/12", percentage: "92%" },
    { class: "Chemistry", attended: "13/13", percentage: "100%" },
    { class: "English", attended: "10/12", percentage: "83%" },
  ];

  const closeModal = () => setShowModal(null);

  const renderModalContent = () => {
    let title, description, items, type;

    if (showModal === "grades") {
      title = "Grades Overview";
      description = "Your current semester grades and detailed academic progress.";
      items = gradesData;
      type = "grades";
    } else if (showModal === "assignments") {
      title = "Upcoming Assignments";
      description = "Your pending assignments and important deadlines.";
      items = assignmentsData;
      type = "assignments";
    } else if (showModal === "attendance") {
      title = "Attendance Record";
      description = "Your class attendance summary for this semester.";
      items = attendanceData;
      type = "attendance";
    } else {
      return null;
    }

    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4"
        onClick={closeModal}
      >
        <div
          className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl overflow-y-auto max-h-[80vh]"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-xl font-bold text-slate-800 mb-2">{title}</h2>
          <p className="text-slate-600 mb-4">{description}</p>

          <div className="space-y-3">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center p-3 bg-slate-50 rounded-lg"
              >
                <div>
                  {type === "grades" && (
                    <>
                      <div className="font-medium text-slate-800">{item.subject}</div>
                      <div className="text-sm text-slate-500">{item.teacher}</div>
                    </>
                  )}
                  {type === "assignments" && (
                    <>
                      <div className="font-medium text-slate-800">{item.task}</div>
                      <div className="text-sm text-slate-500">Due: {item.due}</div>
                    </>
                  )}
                  {type === "attendance" && (
                    <>
                      <div className="font-medium text-slate-800">{item.class}</div>
                      <div className="text-sm text-slate-500">
                        Attended: {item.attended}
                      </div>
                    </>
                  )}
                </div>
                <div className="text-right">
                  {type === "grades" && (
                    <>
                      <div className="font-semibold text-slate-700">{item.grade}</div>
                      <div className="text-xs text-slate-500">{item.percentage}</div>
                    </>
                  )}
                  {type === "assignments" && (
                    <div className="font-semibold text-slate-700">{item.status}</div>
                  )}
                  {type === "attendance" && (
                    <div className="font-semibold text-slate-700">{item.percentage}</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={closeModal}
            className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    );
  };

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
      {loading ? (
        <div className="stu-card p-4 text-sm text-slate-500 max-w-6xl mx-auto mt-6">Loading…!</div>
      ) : (
        <main className="max-w-6xl mx-auto px-4 py-6 space-y-5">
          {/* Section Header Card */}
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

            <div className="hidden sm:flex items-center gap-2 relative">
              <button
                onClick={async () => {
                  await markAllRead();
                  navigate("/students/notifications");
                }}
                className="px-3 py-1.5 text-xs rounded-lg border border-emerald-300 text-emerald-700 hover:bg-emerald-50"
              >
                🔔 View Notifications
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

            </div>
          </div>

          {/* Next Class Card */}
          {nextClass && (
            <div className="stu-card p-6 md:p-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 shadow-lg">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-lg md:text-xl font-bold">
                ⏰
              </div>
              <div className="flex-1">
                <h3 className="text-sm md:text-base text-blue-700">Next Class</h3>
                <p className="text-base md:text-lg font-semibold text-blue-900">
                  {nextClass.subject} with {nextClass.teacher}
                </p>
              </div>
              <div className="ml-auto text-right text-sm md:text-base">
                <div className="text-blue-600 font-medium">Room 204</div>
                <div className="stu-time">{nextClass.start} – {nextClass.end}</div>
              </div>
            </div>
          )}

          {/* Weekly Timetable */}
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
              onClick={() => setShowModal("grades")}
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
              onClick={() => setShowModal("assignments")}
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
              onClick={() => setShowModal("attendance")}
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
            <div className="stu-card p-4 text-center">
              12 <div className="text-xs text-slate-500">Total Courses</div>
            </div>
            <div className="stu-card p-4 text-center">
              8 <div className="text-xs text-slate-500">Completed</div>
            </div>
            <div className="stu-card p-4 text-center">
              24 <div className="text-xs text-slate-500">Credits</div>
            </div>
            <div className="stu-card p-4 text-center">
              3.7 <div className="text-xs text-slate-500">Overall GPA</div>
            </div>
          </div>
        </main>
      )}

      {/* Modal */}
      {renderModalContent()}
    </div>
  );
}

