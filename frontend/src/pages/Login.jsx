import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const apiBase = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  // If already logged in as admin, skip the form
  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("currentUser") || "null");
    const token = sessionStorage.getItem("accessToken");
    if (user?.role === "admin" && token) {
      navigate("/admin", { replace: true });
    }
  }, [navigate]);

  async function submitLogin(e) {
    e?.preventDefault();
    setError("");

    try {
      const res = await fetch(`${apiBase}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || "Login failed");

      // inside submitLogin (after you get `data`)
      sessionStorage.setItem("currentUser", JSON.stringify(data.user));
      sessionStorage.setItem("accessToken", data.access_token);

      switch (data?.user?.role) {
        case "admin":
          navigate("/admin");
          break;
        case "student":
          navigate("/student");
          break;
        case "teacher":
          navigate("/teacher");
          break;
        default:
          setError("Only Admin or Student accounts are supported right now.");
      }

    } catch (err) {
      setError(err.message || "Login failed");
    }
  }

  return (
    <div className="login-bg min-h-dvh w-full overflow-y-auto">
      <div className="mx-auto w-full min-h-dvh flex items-center justify-center px-3">
        <div className="w-full max-w-[min(92vw,520px)] md:max-w-[600px]">
          <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 md:p-8">
             {/* Header */}
            <div className="text-center mb-5 sm:mb-6">
              <div className="w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold text-base sm:text-lg md:text-xl">📚</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-1">Welcome Back</h1>
              <p className="text-slate-500 text-xs sm:text-sm">Sign in to EduManage Pro</p>
            </div>

            {/* Form */}
            <form onSubmit={submitLogin} className="space-y-4 sm:space-y-5">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-10 sm:h-11 md:h-12 px-3 md:px-4 border border-gray-200 rounded-xl
                             placeholder:text-gray-400 text-sm md:text-base
                             focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-10 sm:h-11 md:h-12 px-3 md:px-4 border border-gray-200 rounded-xl
                               placeholder:text-gray-400 text-sm md:text-base
                               focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((s) => !s)}
                    className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 text-sm md:text-base"
                    aria-label="Toggle password visibility"
                  >
                    {showPass ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs sm:text-sm text-gray-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgot(true)}
                  className="text-xs sm:text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Forgot password?
                </button>
              </div>

              {error && (
                <div className="p-2 sm:p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-xs sm:text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full h-10 sm:h-11 md:h-12 rounded-xl bg-indigo-600 text-white text-sm md:text-base font-semibold
                           hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                Sign In
              </button>
            </form>

            {/* Small demo note for your seeded admin */}
            <div className="mt-4 sm:mt-5 p-2.5 sm:p-3 bg-blue-50/70 rounded-xl">
              <h4 className="text-[11px] sm:text-xs font-semibold text-blue-900 mb-1.5">Demo Admin Credentials:</h4>
              <div className="text-[10px] sm:text-[11px] text-blue-800">
                <strong>Admin:</strong> amara@school.edu / admin123
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-4">
            <p className="text-white text-[10px] sm:text-xs opacity-80">
              © 2024 EduManage Pro. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgot && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-5 max-w-sm mx-4 text-center">
            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-blue-600 text-2xl">📧</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Reset Password</h3>
            <p className="text-gray-600 mb-4">Enter your email to receive reset instructions</p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent mb-3"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowForgot(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => { alert("Password reset link sent!"); setShowForgot(false); }}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200"
              >
                Send Reset Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
