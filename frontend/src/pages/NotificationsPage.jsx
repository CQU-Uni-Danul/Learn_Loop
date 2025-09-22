import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [newNotif, setNewNotif] = useState('');
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(sessionStorage.getItem("currentUser") || "null");

  useEffect(() => {
    if (!sessionStorage.getItem("accessToken")) { navigate("/"); return; }

    (async () => {
      try {
        const notifs = await api(`/${user.role}/notifications`);
        setNotifications(notifs ?? []);
      } catch {
        navigate("/");
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate, user.role]);

  const sendNotif = async () => {
    if (!newNotif) return;
    const endpoint = user.role === 'admin' ? '/admin/send-alert' : '/teacher/notifications/send';
    await api(endpoint, { method: "POST", body: JSON.stringify({ content: newNotif }) });
    setNewNotif('');
    const notifs = await api(`/${user.role}/notifications`);
    setNotifications(notifs ?? []);
  };

  return (
    <div className="min-h-dvh tch-bg">
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <h1 className="text-lg font-semibold">Notifications</h1>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="tch-card p-4 space-y-3">
          <div className="tch-chip">🔔 Notifications</div>
          {loading ? <p>Loading...</p> : (
            <ul className="space-y-2">
              {notifications.map((n, i) => <li key={i}>{n.content}</li>)}
            </ul>
          )}
          {(user.role === 'teacher' || user.role === 'admin') && (
            <>
              <textarea
                value={newNotif}
                onChange={(e) => setNewNotif(e.target.value)}
                placeholder={user.role === 'admin' ? 'System-wide alert' : 'Notify students'}
                className="w-full p-2 border border-slate-300 rounded"
              />
              <button onClick={sendNotif} className="btn btn-tch">Send</button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}