import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export default function MessagingPage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(sessionStorage.getItem("currentUser") || "null");

  useEffect(() => {
    if (!sessionStorage.getItem("accessToken")) { navigate("/"); return; }

    (async () => {
      try {
        const msgs = await api(`/${user.role}/messages`);
        setMessages(msgs ?? []);
      } catch {
        navigate("/");
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate, user.role]);

  const sendMessage = async () => {
    if (!newMessage) return;
    await api(`/${user.role}/messages/send`, { method: "POST", body: JSON.stringify({ content: newMessage }) });
    setNewMessage('');
    const msgs = await api(`/${user.role}/messages`);
    setMessages(msgs ?? []);
  };

  const monitor = async (id, action) => {
    if (user.role !== 'admin') return;
    await api(`/admin/messages/${id}/${action}`, { method: "POST" });
    const msgs = await api("/admin/messages");
    setMessages(msgs ?? []);
  };

  return (
    <div className="min-h-dvh tch-bg">
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <h1 className="text-lg font-semibold">Messaging</h1>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="tch-card p-4 space-y-3">
          <div className="tch-chip">💬 Messages</div>
          {loading ? <p>Loading...</p> : (
            <ul className="space-y-2">
              {messages.map((m, i) => (
                <li key={i} className="flex justify-between">
                  {m.content} (From: {m.from})
                  {user.role === 'admin' && (
                    <button onClick={() => monitor(m.id, 'flag')} className="btn btn-tch-outline ml-2">Flag</button>
                  )}
                </li>
              ))}
            </ul>
          )}
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={user.role === 'student' ? 'Clarify doubts' : 'Send updates'}
            className="w-full p-2 border border-slate-300 rounded"
          />
          <button onClick={sendMessage} className="btn btn-tch">Send</button>
        </div>
      </main>
    </div>
  );
}