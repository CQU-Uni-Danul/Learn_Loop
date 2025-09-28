import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api";

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
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

        // const notifs = await apiFetch("/api/teacher/notifications");
        // console.log("Raw notifications response:", notifs);
        // console.log("Notifications array:", notifs.notifications);
        // console.log("Number of notifications:", notifs.notifications?.length);
        
        // setNotifications(notifs.notifications ?? []);
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

  const refreshNotifications = async () => {
    try {
    //   const notifs = await apiFetch("/api/teacher/notifications");
    //   setNotifications(notifs.notifications ?? []);
    } catch (err) {
      console.error('Failed to refresh:', err);
    }
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
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow">
              🔔
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-800">All Notifications</h1>
              <p className="text-[11px] text-slate-500">Manage your sent notifications</p>
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

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="tch-card overflow-hidden">
          <div className="px-4 py-2.5 text-sm font-semibold bg-[rgb(255_251_235)] text-[rgb(217_119_6)] flex items-center justify-between">
            <span>Sent Notifications ({notifications.length})</span>
            <button 
              onClick={refreshNotifications}
              className="text-xs px-2 py-1 bg-white rounded text-amber-700 hover:bg-amber-50"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="p-6 text-center text-slate-500">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="p-6 text-center text-slate-500">
              <div className="text-4xl mb-2">📭</div>
              <p>No notifications sent yet</p>
              <p className="text-xs mt-2">Go back to dashboard and send a notification to see it here</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {notifications.map((notification) => (
                <div key={notification.notification_id} className="p-4 hover:bg-slate-50">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-700">
                        To: {notification.student_name}
                      </span>
                      {notification.is_read && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                          ✓ Read
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500">
                      {new Date(notification.date_sent).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-slate-800 leading-relaxed">{notification.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}