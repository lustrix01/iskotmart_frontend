import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import logo from "../assets/logo.png";
import { Eye, EyeOff } from "lucide-react";

const passwordPolicyMessage =
  "Password must be at least 10 characters and include uppercase, lowercase, number, and special character.";

function validateStrongPassword(password) {
  return (
    password.length >= 10 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState({
    password: false,
    confirm: false,
  });
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!token) {
      setError("Reset token is missing. Request a new reset link.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!validateStrongPassword(password)) {
      setError(passwordPolicyMessage);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/reset_password.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token, password }),
      });

      const raw = await response.text();
      let payload = {};
      try {
        payload = raw ? JSON.parse(raw) : {};
      } catch {
        throw new Error("Reset password API returned a non-JSON response.");
      }

      if (!response.ok) {
        throw new Error(payload.error || "Unable to reset password.");
      }

      setMessage(payload.message || "Password has been reset.");
      setPassword("");
      setConfirmPassword("");
      window.setTimeout(() => navigate("/login", { replace: true }), 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#001a33] via-[#003366] to-[#004080] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/95 p-8 sm:p-10 rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] border border-white/20">
        <div className="text-center mb-8">
          <img src={logo} alt="IskoMart Logo" className="w-24 h-auto mx-auto mb-5" />
          <h1 className="text-2xl font-bold text-[#003366]">Reset password</h1>
          <p className="text-sm text-gray-500 font-medium mt-2">
            Choose a new password for your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="password">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword.password ? "text" : "password"}
                id="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full px-4 py-2.5 pr-12 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF851B] focus:border-[#FF851B] focus:bg-white outline-none transition-all"
                placeholder="New password"
                required
              />
              <button
                type="button"
                aria-label={
                  showPassword.password ? "Hide password" : "Show password"
                }
                onClick={() =>
                  setShowPassword((current) => ({
                    ...current,
                    password: !current.password,
                  }))
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#003366] transition-colors"
              >
                {showPassword.password ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="mt-1.5 text-xs text-gray-500">{passwordPolicyMessage}</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showPassword.confirm ? "text" : "password"}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full px-4 py-2.5 pr-12 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF851B] focus:border-[#FF851B] focus:bg-white outline-none transition-all"
                placeholder="Confirm password"
                required
              />
              <button
                type="button"
                aria-label={
                  showPassword.confirm
                    ? "Hide confirm password"
                    : "Show confirm password"
                }
                onClick={() =>
                  setShowPassword((current) => ({
                    ...current,
                    confirm: !current.confirm,
                  }))
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#003366] transition-colors"
              >
                {showPassword.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
          {message && <p className="text-sm font-semibold text-green-700">{message}</p>}

          <button
            type="submit"
            disabled={isSubmitting || !token}
            className="w-full bg-[#FF851B] text-white font-bold py-3.5 px-4 rounded-xl hover:bg-[#e67616] focus:outline-none focus:ring-4 focus:ring-orange-300 transition-all disabled:opacity-70"
          >
            {isSubmitting ? "Resetting..." : "Reset password"}
          </button>

          <div className="text-center text-sm">
            <Link to="/forgot-password" className="font-bold text-[#0074D9] hover:text-[#003366] hover:underline">
              Request a new link
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
