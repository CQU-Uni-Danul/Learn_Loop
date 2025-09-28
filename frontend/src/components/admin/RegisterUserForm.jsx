import { useState } from "react";
import { createStudent, createTeacher } from "../../lib/api";

/** onSuccess: callback from parent to refresh list + redirect */
export default function RegisterUserForm({ onSuccess }) {
  const [type, setType] = useState("student"); // "student" | "teacher"
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const [student, setStudent] = useState({
    full_name: "",
    email: "",
    password: "",
    grade: "",
    klass: "",
  });

  const [teacher, setTeacher] = useState({
    full_name: "",
    email: "",
    password: "",
    subject: "",
    department: "",
    employee_code: "",
    phone: "", // Expect +61#########
  });

  const onChangeStudent = (e) => setStudent((s) => ({ ...s, [e.target.name]: e.target.value }));
  const onChangeTeacher = (e) => setTeacher((t) => ({ ...t, [e.target.name]: e.target.value }));

  // Frontend AU phone validation (same rule as backend)
  function validateAuPhone(raw) {
    if (!raw) return true; // optional
    const s = String(raw).replace(/[()\s-]/g, "");
    return /^\+61\d{9}$/.test(s);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      if (type === "student") {
        if (!student.full_name || !student.email || !student.password || !student.klass) {
          throw new Error("Full name, email, password, and class are required.");
        }
        await createStudent({
          full_name: student.full_name,
          email: student.email,
          password: student.password,
          grade: student.grade || null,
          class: student.klass,
        });
        setStudent({ full_name: "", email: "", password: "", grade: "", klass: "" });
      } else {
        if (!teacher.full_name || !teacher.email || !teacher.password) {
          throw new Error("Full name, email, and password are required.");
        }
        if (!validateAuPhone(teacher.phone)) {
          throw new Error("Phone must be Australian format: +61 followed by 9 digits (e.g., +61412345678).");
        }
        const normalizedPhone = teacher.phone ? teacher.phone.replace(/[()\s-]/g, "") : null;

        await createTeacher({
          full_name: teacher.full_name,
          email: teacher.email,
          password: teacher.password,
          subject: teacher.subject || null,
          department: teacher.department || null,
          employee_code: teacher.employee_code || null,
          phone: normalizedPhone,
        });
        setTeacher({ full_name: "", email: "", password: "", subject: "", department: "", employee_code: "", phone: "" });
      }
      setMsg({ type: "success", text: "User registered successfully." });
      onSuccess?.();
    } catch (err) {
      setMsg({ type: "error", text: err?.message || "Failed to register." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <h2 className="text-xl font-semibold mb-6">Register New User</h2>

      <form onSubmit={onSubmit} className="space-y-5">
        {/* User Type */}
        <div>
          <label className="block text-sm font-medium mb-1">User Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full rounded-lg border px-3 py-2"
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
          </select>
        </div>

        {/* Student Fields */}
        {type === "student" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Full Name">
              <input name="full_name" value={student.full_name} onChange={onChangeStudent} className="w-full rounded-lg border px-3 py-2" required />
            </Field>
            <Field label="Email">
              <input type="email" name="email" value={student.email} onChange={onChangeStudent} className="w-full rounded-lg border px-3 py-2" required />
            </Field>
            <Field label="Password">
              <input type="password" name="password" value={student.password} onChange={onChangeStudent} className="w-full rounded-lg border px-3 py-2" required />
            </Field>
            <Field label="Grade">
              <input name="grade" value={student.grade} onChange={onChangeStudent} className="w-full rounded-lg border px-3 py-2" placeholder="e.g., 8" />
            </Field>
            <Field label="Class">
              <input name="klass" value={student.klass} onChange={onChangeStudent} className="w-full rounded-lg border px-3 py-2" placeholder="e.g., A" required />
            </Field>
          </div>
        )}

        {/* Teacher Fields */}
        {type === "teacher" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Full Name">
              <input name="full_name" value={teacher.full_name} onChange={onChangeTeacher} className="w-full rounded-lg border px-3 py-2" required />
            </Field>
            <Field label="Email">
              <input type="email" name="email" value={teacher.email} onChange={onChangeTeacher} className="w-full rounded-lg border px-3 py-2" required />
            </Field>
            <Field label="Password">
              <input type="password" name="password" value={teacher.password} onChange={onChangeTeacher} className="w-full rounded-lg border px-3 py-2" required />
            </Field>
            <Field label="Subject">
              <input name="subject" value={teacher.subject} onChange={onChangeTeacher} className="w-full rounded-lg border px-3 py-2" placeholder="e.g., Math" />
            </Field>
            <Field label="Department">
              <input name="department" value={teacher.department} onChange={onChangeTeacher} className="w-full rounded-lg border px-3 py-2" placeholder="e.g., Science" />
            </Field>
            <Field label="Employee Code">
              <input name="employee_code" value={teacher.employee_code} onChange={onChangeTeacher} className="w-full rounded-lg border px-3 py-2" placeholder="e.g., TCH001" />
            </Field>
            <Field label="Phone (AU: +61…)">
              <input
                type="tel"
                name="phone"
                value={teacher.phone}
                onChange={onChangeTeacher}
                className="w-full rounded-lg border px-3 py-2"
                placeholder="+61412345678"
                pattern="^\+61\d{9}$"
                title="Must be +61 followed by 9 digits (e.g., +61412345678)"
              />
            </Field>
          </div>
        )}

        {msg && (
          <div className={`text-sm rounded-md px-3 py-2 ${
              msg.type === "success" ? "bg-green-50 text-green-700" :
              msg.type === "error"   ? "bg-red-50 text-red-700"   :
                                       "bg-blue-50 text-blue-700"}`}>
            {msg.text}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {loading ? "Saving..." : type === "student" ? "Register Student" : "Register Teacher"}
        </button>
      </form>
    </div>
  );
}

/* Small label wrapper for consistency */
function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      {children}
    </div>
  );
}
