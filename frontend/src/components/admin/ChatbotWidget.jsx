import { useEffect, useRef, useState } from "react";
import { chatStudent, chatTeacher } from "../../lib/api";

export default function ChatbotWidget({ role = "student" }) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([{ from: "bot", text: "Hi! Ask me about your timetable or notifications." }]);
  const [input, setInput] = useState("");
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [msgs, open]);

  async function send() {
    const q = input.trim();
    if (!q) return;
    setMsgs(m => [...m, { from: "you", text: q }]);
    setInput("");

    try {
      const res = role === "teacher" ? await chatTeacher(q) : await chatStudent(q);
      setMsgs(m => [...m, { from: "bot", text: res.reply }]);
    } catch (e) {
      setMsgs(m => [...m, { from: "bot", text: "Sorry, I hit an error. Try again." }]);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-5 right-5 rounded-full w-14 h-14 bg-emerald-600 text-white shadow-lg text-xl"
        title="Chat"
      >
        💬
      </button>

      {open && (
        <div className="fixed bottom-20 right-5 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
          <div className="px-4 py-3 bg-emerald-600 text-white text-sm font-semibold">
            LearnLoop Assistant ({role})
          </div>
          <div ref={listRef} className="p-3 h-80 overflow-y-auto space-y-2 bg-slate-50">
            {msgs.map((m, i) => (
              <div key={i} className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${m.from==="you" ? "ml-auto bg-emerald-600 text-white" : "mr-auto bg-white border border-slate-200"}`}>
                {m.text}
              </div>
            ))}
          </div>
          <div className="p-2 border-t border-slate-200 flex gap-2">
            <input
              className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Ask about timetable, notifications…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send()}
            />
            <button onClick={send} className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm">Send</button>
          </div>
        </div>
      )}
    </>
  );
}
