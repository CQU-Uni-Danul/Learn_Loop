import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api";

export default function StudentNotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState(null);

  useEffect(() => {
    const token = sessionStorage.getItem("accessToken");
    const user = JSON.parse(sessionStorage.getItem("currentUser") || "null");

    if (!token || !user || user.role !== "student") {
      navigate("/");
      return;
    }

    (async () => {
      try {
        // Load profile
        const profile = await apiFetch("/api/auth/me");
        setMe(profile);

        // Load notifications (for student)
        const notifs = await apiFetch("/api/student/notifications");
        setNotifications(notifs.notifications ?? []);
      } catch (err) {
        console.error("Failed to load student notifications:", err);
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
      const notifs = await apiFetch("/api/student/notifications");
      setNotifications(notifs.notifications ?? []);
    } catch (err) {
      console.error("Failed to refresh notifications:", err);
    }
  };

  return (
    <div className="min-h-dvh bg-gradient-to-b from-emerald-50 to-emerald-100/50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/student")}
              className="text-slate-600 hover:text-slate-800"
            >
              ← Back
            </button>
            <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow">
              🔔
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-800">
                My Notifications
              </h1>
              <p className="text-[11px] text-slate-500">
                Messages sent to you by teachers/admins
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {me && (
              <>
                <span className="hidden sm:inline text-sm text-slate-600">
                  Hi, {me.name?.split(" ")[0]}
                </span>
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm font-semibold">
                  S
                </div>
              </>
            )}
            <button onClick={logout} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="h-1 bg-emerald-600" />

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow">
          <div className="px-4 py-2.5 text-sm font-semibold bg-emerald-50 text-emerald-700 flex items-center justify-between">
            <span>Received Notifications ({notifications.length})</span>
            <button
              onClick={refreshNotifications}
              className="text-xs px-2 py-1 bg-white rounded text-emerald-700 hover:bg-emerald-50"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="p-6 text-center text-slate-500">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-6 text-center text-slate-500">
              <div className="text-4xl mb-2">📭</div>
              <p>No notifications yet</p>
              <p className="text-xs mt-2">Your teachers will send important messages here</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {notifications.map((notification) => (
                <div
                  key={notification.notification_id}
                  className="p-4 hover:bg-slate-50"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-700">
                        From: {notification.sender_name}
                      </span>
                      {!notification.is_read && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">
                          • New
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500">
                      {new Date(notification.date_sent).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-slate-800 leading-relaxed">
                    {notification.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
