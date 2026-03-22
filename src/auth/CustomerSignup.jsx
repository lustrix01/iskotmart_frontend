import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.png";

export default function CustomerSignup() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dobDay, setDobDay] = useState("");
  const [dobMonth, setDobMonth] = useState("");
  const [dobYear, setDobYear] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSignup = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords don't match!");
      return;
    }
    if (!agreeTerms) {
      alert("Please agree to the Terms and Conditions.");
      return;
    }
    if (username && email && password) {
      login({
        id: Date.now(),
        name: `${firstName} ${lastName}`,
        role: "customer",
        email,
      });
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#001a33] via-[#003366] to-[#004080] flex items-center justify-center p-4 lg:p-8">
      {/* Background glowing orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#FF851B] rounded-full mix-blend-multiply filter blur-[128px] opacity-20"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[#0074D9] rounded-full mix-blend-multiply filter blur-[128px] opacity-20"></div>

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 items-center w-full max-w-6xl">
        {/* Left Side: Logo and Branding */}
        <div className="flex flex-col items-center justify-center group text-center">
          <img
            src={logo}
            alt="IskoMart Logo"
            className="w-40 md:w-56 lg:w-72 drop-shadow-[0_20px_50px_rgba(0,0,0,0.4)] transition-transform duration-700 hover:scale-105 mb-6"
          />
          <h1 className="text-4xl font-extrabold mb-1 tracking-tight">
            <span className="text-[#0074D9]">Isko</span>
            <span className="text-[#FF851B]">Mart</span>
          </h1>
          <h2 className="text-2xl font-bold text-white mb-1">
            Customer Registration
          </h2>
          <p className="text-sm text-gray-300 font-medium">
            Join us and start shopping with us!
          </p>
        </div>

        {/* Right Side: Form Container (Scroll removed, layout tightened) */}
        <div className="flex justify-center w-full">
          <div className="bg-white/95 backdrop-blur-sm p-6 sm:p-8 rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] w-full max-w-lg border border-white/20">
            {/* Top Back Arrow */}
            <div className="mb-2">
              <Link
                to="/signup"
                className="text-gray-400 hover:text-[#FF851B] transition-colors inline-flex items-center gap-1 text-sm font-semibold"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                  />
                </svg>
                Back
              </Link>
            </div>

            {/* Tightened space-y to make it fit */}
            <form onSubmit={handleSignup} className="space-y-3">
              {/* Name Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-0.5">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF851B] outline-none text-sm transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-0.5">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF851B] outline-none text-sm transition-all"
                  />
                </div>
              </div>

              {/* Gender Radio Buttons */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Gender
                </label>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value="Male"
                      onChange={(e) => setGender(e.target.value)}
                      className="text-[#FF851B] focus:ring-[#FF851B]"
                    />{" "}
                    Male
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value="Other"
                      onChange={(e) => setGender(e.target.value)}
                      className="text-[#FF851B] focus:ring-[#FF851B]"
                    />{" "}
                    Other
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value="Female"
                      onChange={(e) => setGender(e.target.value)}
                      className="text-[#FF851B] focus:ring-[#FF851B]"
                    />{" "}
                    Female
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value="Prefer not to say"
                      onChange={(e) => setGender(e.target.value)}
                      className="text-[#FF851B] focus:ring-[#FF851B]"
                    />{" "}
                    Prefer not to say
                  </label>
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-0.5 flex justify-between">
                  Username{" "}
                  <span className="text-gray-400 font-normal text-[10px] hidden sm:inline">
                    (Letters, numbers, underscore)
                  </span>
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  pattern="[a-zA-Z0-9_]+"
                  required
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF851B] outline-none text-sm transition-all"
                />
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-0.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF851B] outline-none text-sm transition-all"
                />
              </div>

              {/* Phone and DOB Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-0.5">
                    Phone number{" "}
                    <span className="text-gray-400 font-normal text-[10px] hidden sm:inline">
                      (+63)
                    </span>
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-2.5 text-xs text-gray-500 bg-gray-100 border border-r-0 border-gray-200 rounded-l-lg">
                      +63
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      maxLength="10"
                      placeholder="9XXXXXXXXX"
                      required
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-r-lg focus:ring-2 focus:ring-[#FF851B] outline-none text-sm transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-0.5">
                    Date of birth{" "}
                    <span className="text-gray-400 font-normal text-[10px] hidden sm:inline">
                      (DD/MM/YYYY)
                    </span>
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <input
                      type="text"
                      value={dobDay}
                      onChange={(e) => setDobDay(e.target.value)}
                      placeholder="DD"
                      maxLength="2"
                      required
                      className="w-full px-1 py-2 text-center bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF851B] outline-none text-sm"
                    />
                    <input
                      type="text"
                      value={dobMonth}
                      onChange={(e) => setDobMonth(e.target.value)}
                      placeholder="MM"
                      maxLength="2"
                      required
                      className="w-full px-1 py-2 text-center bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF851B] outline-none text-sm"
                    />
                    <input
                      type="text"
                      value={dobYear}
                      onChange={(e) => setDobYear(e.target.value)}
                      placeholder="YYYY"
                      maxLength="4"
                      required
                      className="w-full px-1 py-2 text-center bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF851B] outline-none text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Password Row (Combined into one row to save vertical space) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-0.5">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF851B] outline-none text-sm transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-0.5">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF851B] outline-none text-sm transition-all"
                  />
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="pt-1">
                <label className="flex items-start gap-2 cursor-pointer text-[11px] text-gray-500 leading-tight">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    required
                    className="mt-0.5 text-[#FF851B] border-gray-300 rounded focus:ring-[#FF851B] cursor-pointer"
                  />
                  <span>
                    I agree to the{" "}
                    <a
                      href="#"
                      className="text-[#0074D9] hover:underline font-semibold"
                    >
                      Terms and Conditions
                    </a>{" "}
                    and{" "}
                    <a
                      href="#"
                      className="text-[#0074D9] hover:underline font-semibold"
                    >
                      Privacy Policy
                    </a>
                    .
                  </span>
                </label>
              </div>

              {/* Action Buttons (Cancel and Submit side-by-side) */}
              <div className="flex gap-3 pt-2">
                <Link
                  to="/signup"
                  className="w-1/3 flex items-center justify-center bg-white border-2 border-gray-200 text-gray-600 font-bold py-2.5 px-4 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-300"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  className="w-2/3 bg-[#FF851B] text-white font-bold py-2.5 px-4 rounded-xl hover:bg-[#e67616] hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgb(255,133,27,0.3)] focus:outline-none focus:ring-4 focus:ring-orange-300 transition-all duration-300"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
