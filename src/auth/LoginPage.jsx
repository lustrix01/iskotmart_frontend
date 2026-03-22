import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.png";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = (e) => {
    e.preventDefault();
    if (email && password) {
      let role = "customer";
      let redirectPath = "/";

      // SIMULATION LOGIC: Determine role based on the email entered
      const lowerEmail = email.toLowerCase();

      if (lowerEmail.includes("admin")) {
        role = "admin";
        redirectPath = "/admin";
      } else if (lowerEmail.includes("mod")) {
        role = "moderator";
        redirectPath = "/moderator";
      } else if (lowerEmail.includes("merchant")) {
        role = "merchant";
        redirectPath = "/merchant";
      } else {
        role = "customer";
        redirectPath = "/"; // Default customer route
      }

      // Save user session in context
      login({
        id: Date.now(),
        name: `${role.toUpperCase()} User`,
        role: role,
        email: email,
      });

      // Send them to their specific page
      navigate(redirectPath);
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
                Sign in to continue shopping
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
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF851B] focus:border-[#FF851B] focus:bg-white outline-none transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>

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
                  className="w-full bg-[#FF851B] text-white font-bold py-3.5 px-4 rounded-xl hover:bg-[#e67616] hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgb(255,133,27,0.3)] focus:outline-none focus:ring-4 focus:ring-orange-300 transition-all duration-300"
                >
                  Sign In
                </button>
              </div>

              <div className="text-center text-sm text-gray-500 mt-6">
                Don't have an account?{" "}
                <Link
                  to="/signup"
                  className="font-bold text-[#FF851B] hover:text-[#e67616] hover:underline transition-colors"
                >
                  Sign Up
                </Link>
              </div>

              {/* Developer Cheat Sheet for testing */}
              <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-500">
                <p className="font-bold mb-1 text-gray-700">
                  Simulation Test Emails (any password):
                </p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>
                    <strong>admin</strong>@iskomart.com &rarr; Admin Home
                  </li>
                  <li>
                    <strong>mod</strong>@iskomart.com &rarr; Moderator Home
                  </li>
                  <li>
                    <strong>merchant</strong>@iskomart.com &rarr; Merchant Home
                  </li>
                  <li>
                    <strong>anything_else</strong>@email.com &rarr; Customer
                    Home
                  </li>
                </ul>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
