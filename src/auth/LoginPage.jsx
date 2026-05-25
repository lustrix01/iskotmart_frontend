import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import {
  clearRememberedClientSession,
  rememberClientSession,
} from "../api/clientSession";
import Email2fa from "./Email2fa";
import logo from "../assets/logo.png";
import { Eye, EyeOff } from "lucide-react";

const redirectByRole = {
  merchant: "/merchant",
  customer: "/",
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [pending2fa, setPending2fa] = useState(null);

  const from = location.state?.from;
  const requestedPath =
    from && `${from.pathname || "/"}${from.search || ""}${from.hash || ""}`;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/login.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const raw = await response.text();
      let payload = {};
      try {
        payload = raw ? JSON.parse(raw) : {};
      } catch {
        throw new Error(
          "Login API returned a non-JSON response. Check Vite proxy/PHP server.",
        );
      }
      if (!response.ok) {
        throw new Error(payload.error || "Unable to sign in.");
      }

      // server may require 2FA
      if (payload.requires2fa) {
        // keep creds temporarily for resend
        setPending2fa({ email, password, rememberMe });
        setIsSubmitting(false);
        return;
      }

      login(payload.user);
      if (rememberMe) {
        rememberClientSession();
      } else {
        clearRememberedClientSession();
      }
      const isMerchant = payload.user.role === "merchant";
      const merchantRequestedPath =
        isMerchant && requestedPath?.startsWith("/merchant")
          ? requestedPath
          : null;
      const destination = isMerchant
        ? merchantRequestedPath || "/merchant"
        : requestedPath || redirectByRole[payload.user.role] || "/";

      navigate(destination, {
        replace: true,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#001a33] via-[#003366] to-[#004080] flex items-center justify-center p-4 lg:p-8">
      {/* Background glowing orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#FF851B] rounded-full mix-blend-multiply filter blur-[128px] opacity-20"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[#0074D9] rounded-full mix-blend-multiply filter blur-[128px] opacity-20"></div>

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-16 lg:gap-32 items-center w-full max-w-6xl">
        {/* Left Side: Logo */}
        <div className="flex justify-center group">
          <img
            src={logo}
            alt="IskoMart Logo"
            className="w-48 h-auto md:w-64 lg:w-80 drop-shadow-[0_20px_50px_rgba(0,0,0,0.4)] transition-transform duration-700 hover:scale-105"
          />
        </div>

        {/* Right Side: Login Form Container */}
        <div className="flex justify-center w-full">
          <div className="bg-white/95 backdrop-blur-sm p-8 sm:p-10 rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] w-full max-w-md border border-white/20">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-extrabold mb-1 tracking-tight">
                <span className="text-[#0074D9]">Isko</span>
                <span className="text-[#FF851B]">Mart</span>
              </h1>
              <h2 className="text-2xl font-bold text-[#003366] mb-1">
                Welcome Back!
              </h2>
              <p className="text-sm text-gray-500 font-medium">
                Sign in to continue
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label
                  className="block text-sm font-semibold text-gray-700 mb-1.5"
                  htmlFor="email"
                >
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF851B] focus:border-[#FF851B] focus:bg-white outline-none transition-all"
                  placeholder="name@email.com"
                  required
                />
              </div>

              <div>
                <label
                  className="block text-sm font-semibold text-gray-700 mb-1.5"
                  htmlFor="password"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 pr-12 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF851B] focus:border-[#FF851B] focus:bg-white outline-none transition-all"
                    placeholder="Password"
                    required
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#003366] transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              {error && (
                <p className="text-sm font-semibold text-red-600">{error}</p>
              )}

              <div className="flex items-center justify-between text-sm mt-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="remember"
                    name="remember"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-[#FF851B] border-gray-300 rounded focus:ring-[#FF851B] cursor-pointer"
                  />
                  <label
                    htmlFor="remember"
                    className="ml-2 text-gray-600 font-medium cursor-pointer"
                  >
                    Remember me
                  </label>
                </div>
                <Link
                  to="/forgot-password"
                  className="font-bold text-[#0074D9] hover:text-[#003366] hover:underline transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#FF851B] text-white font-bold py-3.5 px-4 rounded-xl hover:bg-[#e67616] hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgb(255,133,27,0.3)] focus:outline-none focus:ring-4 focus:ring-orange-300 transition-all duration-300 disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  {isSubmitting ? "Signing in..." : "Sign In"}
                </button>
              </div>

              <button
                type="button"
                onClick={() => navigate("/", { replace: true })}
                className="w-full border-2 border-[#003366] text-[#003366] font-bold py-3 px-4 rounded-xl hover:bg-[#003366] hover:text-white transition-all duration-300"
              >
                Continue as guest
              </button>

              <div className="text-center text-sm text-gray-500 mt-6">
                Don't have an account?{" "}
                <Link
                  to="/signup"
                  className="font-bold text-[#FF851B] hover:text-[#e67616] hover:underline transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
      {pending2fa && (
        <Email2fa
          email={pending2fa.email}
          password={pending2fa.password}
          rememberMe={pending2fa.rememberMe}
          onClose={() => setPending2fa(null)}
        />
      )}
    </div>
  );
}
