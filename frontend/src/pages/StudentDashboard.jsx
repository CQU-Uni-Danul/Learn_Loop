import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listStudents } from "../lib/api";

function StudentDashboard() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("currentUser") || "null");
    const token = sessionStorage.getItem("accessToken");
    if (!user || user.role !== "student" || !token) {
      navigate("/", { replace: true });
      return;
    }

    async function fetchStudents() {
      try {
        const data = await listStudents();
        setStudents(data);
      } catch (err) {
        console.error("Failed to load students:", err.message);
      }
    }

    fetchStudents();
  }, [navigate]);

  return (
    <div className="max-w-4xl mx-auto py-6">
      <h2 className="text-2xl font-bold mb-4">Students</h2>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left">Name</th>
            <th className="p-2 text-left">Email</th>
            <th className="p-2 text-left">Grade</th>
            <th className="p-2 text-left">Class</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s) => (
            <tr key={s.id} className="border-t">
              <td className="p-2">{s.full_name}</td>
              <td className="p-2">{s.email}</td>
              <td className="p-2">{s.grade || "-"}</td>
              <td className="p-2">{s._class || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default StudentDashboard;
