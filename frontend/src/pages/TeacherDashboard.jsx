import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api"; // Make sure this handles JWT headers

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
  const [materials, setMaterials] = useState([]);
  const [message, setMessage] = useState('');
  const [notification, setNotification] = useState('');
  const [notificationsList, setNotificationsList] = useState([]);
  

  // Load profile, schedule, materials, notifications
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

      const sched = await apiFetch("/api/teacher/schedule/me");
      setToday(sched.schedule ?? []);

      // 👇 UNCOMMENT AND FIX THIS
      const notifs = await apiFetch("/api/teacher/notifications");
      console.log("Loaded notifications:", notifs); // Debug log
      setNotificationsList(notifs.notifications ?? []);
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

  const handleUpload = async (file) => {
    if (!file) return;
    const body = new FormData();
    body.append("file", file);

    try {
      const data = await apiFetch("/api/teacher/materials/upload", {
        method: "POST",
        body,
      });
      if (data?.ok) {
        const files = await apiFetch("/api/teacher/materials");
        setMaterials(files ?? []);
        alert("Uploaded!");
      } else {
        alert("Upload failed");
      }
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    }
  };

  const sendMessage = async () => {
    if (!message) return;
    try {
      await apiFetch("/api/teacher/messages/send", {
        method: "POST",
        body: JSON.stringify({ content: message }),
      });
      setMessage('');
      alert("Message sent!");
    } catch (err) {
      console.error(err);
      alert("Failed to send message");
    }
  };

const sendNotification = async () => {
  if (!notification) return;

  try {
    await apiFetch("/api/teacher/notifications/send", {
      method: "POST",
      body: JSON.stringify({ content: notification }),
    });

    setNotification('');

    // // 👇 UNCOMMENT AND FIX THIS
    // const notifs = await apiFetch("/api/teacher/notifications");
    // setNotificationsList(notifs.notifications ?? []);

    alert("Notification sent!");
  } catch (err) {
    console.error('Notification send error:', err);
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
          <button onClick={() => navigate('/timetable')} className="btn btn-tch-outline m-4">Edit Timetable</button>
        </div>

        {/* Materials */}
        <div className="tch-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="tch-chip">📚 Materials</div>
            <button onClick={async () => setMaterials(await apiFetch("/api/teacher/materials") ?? [])} className="btn btn-tch-outline">Refresh</button>
          </div>

          <form onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }}>
            <label className="block w-full cursor-pointer">
              <span className="btn btn-tch inline-block">Upload Material</span>
              <input type="file" className="hidden" />
            </label>
          </form>

          {materials.length > 0 ? (
            <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
              {materials.map((m) => <li key={m}>{m}</li>)}
            </ul>
          ) : <p className="text-xs text-slate-500">No materials uploaded yet.</p>}
          <button onClick={() => navigate('/materials')} className="btn btn-tch-outline">View All Materials</button>
        </div>

        {/* Messaging */}
        <div className="tch-card p-4 space-y-3">
          <div className="tch-chip">💬 Messaging</div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Send updates to students"
            className="w-full p-2 border border-slate-300 rounded"
          />
          <button onClick={sendMessage} className="btn btn-tch">Send Message</button>
          <button onClick={() => navigate('/messages')} className="btn btn-tch-outline">View Messages</button>
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
          <button onClick={testLoadNotifications} className="btn btn-tch-outline">
  🔍 Test Load Notifications
</button>

          {/* Display sent notifications */}
          {notificationsList.length > 0 && (
            <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1 mt-3">
              {notificationsList.map((n) => (
                <li key={n.notification_id}>
                  <strong>To:</strong> {n.student_name} | <strong>Message:</strong> {n.message} | <strong>Date:</strong> {new Date(n.date_sent).toLocaleString()}
                </li>
              ))}
            </ul>
          )}
          <button onClick={() => navigate('/notifications')} className="btn btn-tch-outline">View All Notifications</button>
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
