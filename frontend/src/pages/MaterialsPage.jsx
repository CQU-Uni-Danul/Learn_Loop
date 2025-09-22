import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export default function MaterialsPage() {
  const navigate = useNavigate();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(sessionStorage.getItem("currentUser") || "null");

  useEffect(() => {
    if (!sessionStorage.getItem("accessToken")) { navigate("/"); return; }

    (async () => {
      try {
        const files = await api(`/${user.role}/materials`);
        setMaterials(files ?? []);
      } catch {
        navigate("/");
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate, user.role]);

  const handleUpload = async (file) => {
    if (user.role !== 'teacher' || !file) return;
    const body = new FormData();
    body.append("file", file);
    await fetch(`${import.meta.env.VITE_API_BASE || "http://localhost:8000"}/${user.role}/materials/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${sessionStorage.getItem("accessToken") || ""}` },
      body,
    });
    const files = await api(`/${user.role}/materials`);
    setMaterials(files ?? []);
    alert("Uploaded!");
  };

  const monitor = async (id, action) => {
    if (user.role !== 'admin') return;
    await api(`/admin/materials/${id}/${action}`, { method: "POST" });
    const files = await api("/admin/materials");
    setMaterials(files ?? []);
  };

  return (
    <div className="min-h-dvh tch-bg">
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <h1 className="text-lg font-semibold">Materials Management</h1>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="tch-card p-4 space-y-3">
          <div className="tch-chip">📚 Materials</div>
          {loading ? <p>Loading...</p> : (
            <ul className="space-y-2">
              {materials.map((m, i) => (
                <li key={i} className="flex justify-between">
                  {user.role === 'student' ? (
                    <a href={m.url} download className="text-blue-600 hover:underline">{m.name}</a>
                  ) : (
                    m.name
                  )}
                  {user.role === 'admin' && (
                    <>
                      <button onClick={() => monitor(m.id, 'approve')} className="btn btn-tch ml-2">Approve</button>
                      <button onClick={() => monitor(m.id, 'reject')} className="btn btn-tch-outline ml-2">Reject</button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
          {user.role === 'teacher' && (
            <form onChange={(e) => handleUpload(e.target.files?.[0])}>
              <label className="block w-full cursor-pointer">
                <span className="btn btn-tch inline-block">Upload New Material</span>
                <input type="file" className="hidden" />
              </label>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}