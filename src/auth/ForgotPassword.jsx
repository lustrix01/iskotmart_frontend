import { useState } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo.png";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [resetLink, setResetLink] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setResetLink("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/forgot_password.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });

      const raw = await response.text();
      let payload = {};
      try {
        payload = raw ? JSON.parse(raw) : {};
      } catch {
        throw new Error("Forgot password API returned a non-JSON response.");
      }

      if (!response.ok) {
        throw new Error(payload.error || "Unable to prepare reset link.");
      }

      setMessage(payload.message || "Reset instructions are ready.");
      setResetLink(payload.resetLink || "");
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
          <h1 className="text-2xl font-bold text-[#003366]">Forgot password</h1>
          <p className="text-sm text-gray-500 font-medium mt-2">
            Enter your account email to prepare a reset link.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="email">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF851B] focus:border-[#FF851B] focus:bg-white outline-none transition-all"
              placeholder="name@email.com"
              required
            />
          </div>

          {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
          {message && <p className="text-sm font-semibold text-green-700">{message}</p>}
          {resetLink && (
            <div className="rounded-xl border border-orange-200 bg-orange-50 p-3 text-sm text-gray-700">
              <p className="font-semibold text-[#003366]">Local reset link</p>
              <Link className="break-all font-semibold text-[#0074D9] hover:underline" to={new URL(resetLink).pathname + new URL(resetLink).search}>
                {resetLink}
              </Link>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#FF851B] text-white font-bold py-3.5 px-4 rounded-xl hover:bg-[#e67616] focus:outline-none focus:ring-4 focus:ring-orange-300 transition-all disabled:opacity-70"
          >
            {isSubmitting ? "Preparing..." : "Prepare reset link"}
          </button>

          <div className="text-center text-sm">
            <Link to="/login" className="font-bold text-[#0074D9] hover:text-[#003366] hover:underline">
              Back to sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
