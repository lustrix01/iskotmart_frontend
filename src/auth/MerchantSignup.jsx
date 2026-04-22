import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.png";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export default function MerchantSignup() {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Multi-step state management
  const [step, setStep] = useState(1);

  // State for inline error validation
  const [emailError, setEmailError] = useState("");

  // Centralized form data state
  const [formData, setFormData] = useState({
    // Step 1: Business Details
    businessName: "",
    bizProvince: "",
    bizCity: "",
    sameAsBiz: false,
    postalProvince: "",
    postalCity: "",
    // Step 2: Owner Details
    firstName: "",
    lastName: "",
    username: "",
    gender: "",
    studentEmail: "",
    phone: "",
    studentNumber: "",
    dobDay: "",
    dobMonth: "",
    dobYear: "",
    idFile: null, // Holds the uploaded file object
    password: "",
    confirmPassword: "",
    // Step 3: Payment Options
    payments: { gcash: false, paymaya: false, paypal: false, stripe: false },
    agreeTerms: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear email error automatically when user starts typing again
    if (name === "studentEmail") {
      setEmailError("");
    }
  };

  const handlePaymentChange = (e) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      payments: { ...prev.payments, [name]: checked },
    }));
  };

  const nextStep = (e) => {
    e.preventDefault(); // Prevents default form submission

    if (step === 2) {
      // 1. Password Match Validation
      if (formData.password !== formData.confirmPassword) {
        alert("Passwords don't match!");
        return;
      }

      // 2. Official Email Validation
      if (!formData.studentEmail.endsWith("@bicol-u.edu.ph")) {
        setEmailError(
          "Only valid @bicol-u.edu.ph email addresses are allowed.",
        );
        alert(
          "Registration failed: Please use your official @bicol-u.edu.ph email.",
        );
        return;
      }

      // 3. Manual File Upload Validation (Fixes the silent block error)
      if (!formData.idFile) {
        alert("Please upload your COR or valid Student ID to continue.");
        return;
      }
    }

    // Move to next step if all validations pass
    setStep((prev) => prev + 1);
  };

  const prevStep = () => {
    setStep((prev) => prev - 1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.agreeTerms) {
      alert("Please agree to the Terms and Conditions.");
      return;
    }
    // Submit final data
    console.log("Merchant Data Submitted:", formData);
    login({
      id: Date.now(),
      name: formData.businessName,
      role: "merchant",
      email: formData.studentEmail,
    });
    navigate("/");
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
            Merchant Registration
          </h2>
          <p className="text-sm text-gray-300 font-medium">
            Join us and sell your goods or services!
          </p>

          {/* Descriptive Requirement Banner */}
          <div className="mt-8 bg-blue-900/40 border border-blue-400/30 rounded-xl p-4 max-w-sm flex items-start gap-3 text-left">
            <AlertCircle className="text-[#1EA1F2] shrink-0 mt-0.5" size={20} />
            <div>
              <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-1">
                BU Students Only
              </h4>
              <p className="text-blue-200 text-[11px] leading-relaxed">
                To maintain a trusted campus marketplace, merchant accounts are
                strictly exclusive to active Bicol University students. You{" "}
                <b>must</b> use your official{" "}
                <span className="font-bold text-white">@bicol-u.edu.ph</span>{" "}
                email to register.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Form Container */}
        <div className="flex justify-center w-full">
          <div className="bg-white/95 backdrop-blur-sm p-6 sm:p-8 rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] w-full max-w-lg border border-white/20 relative text-black">
            {/* Top Back Arrow */}
            <div className="mb-4">
              {step === 1 ? (
                <Link
                  to="/signup"
                  className="text-gray-400 hover:text-[#1EA1F2] transition-colors inline-block"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                    />
                  </svg>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={prevStep}
                  className="text-gray-400 hover:text-[#1EA1F2] transition-colors inline-block"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                    />
                  </svg>
                </button>
              )}
            </div>

            {/* Progress Bar Header */}
            <div className="flex items-center justify-between bg-[#1EA1F2] text-white text-[10px] sm:text-xs font-semibold rounded-full px-4 py-2 mb-6 shadow-md">
              <div
                className={`flex items-center gap-1 ${step >= 1 ? "opacity-100" : "opacity-50"}`}
              >
                {step > 1 ? (
                  <svg
                    className="w-4 h-4 bg-white text-[#1EA1F2] rounded-full p-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <span className="w-4 h-4 flex items-center justify-center bg-white text-[#1EA1F2] rounded-full">
                    1
                  </span>
                )}
                <span>Business Details</span>
              </div>
              <span className="text-white/50">/</span>
              <div
                className={`flex items-center gap-1 ${step >= 2 ? "opacity-100" : "opacity-50"}`}
              >
                {step > 2 ? (
                  <svg
                    className="w-4 h-4 bg-white text-[#1EA1F2] rounded-full p-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <span className="w-4 h-4 flex items-center justify-center border border-white rounded-full">
                    2
                  </span>
                )}
                <span>Owner Details</span>
              </div>
              <span className="text-white/50">/</span>
              <div
                className={`flex items-center gap-1 ${step >= 3 ? "opacity-100" : "opacity-50"}`}
              >
                <span className="w-4 h-4 flex items-center justify-center border border-white rounded-full">
                  3
                </span>
                <span>Payment Options</span>
              </div>
            </div>

            {/* FORM STEPS CONTENT */}
            <form
              onSubmit={step === 3 ? handleSubmit : nextStep}
              className="space-y-4"
            >
              {/* ================= STEP 1 ================= */}
              {step === 1 && (
                <div className="space-y-4 animate-[fadeIn_0.3s_ease-in-out]">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Business Name
                    </label>
                    <input
                      type="text"
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1EA1F2] outline-none text-sm transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Business Address
                    </label>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <select
                        name="bizProvince"
                        value={formData.bizProvince}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1EA1F2] outline-none text-sm text-gray-600"
                      >
                        <option value="">Province</option>
                        <option value="Albay">Albay</option>
                        <option value="CamSur">Camarines Sur</option>
                      </select>
                      <select
                        name="bizCity"
                        value={formData.bizCity}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1EA1F2] outline-none text-sm text-gray-600"
                      >
                        <option value="">Municipality/City</option>
                        <option value="Legazpi">Legazpi</option>
                        <option value="Naga">Naga</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Postal Address
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-600 mb-2">
                      <input
                        type="checkbox"
                        name="sameAsBiz"
                        checked={formData.sameAsBiz}
                        onChange={handleChange}
                        className="text-[#1EA1F2] focus:ring-[#1EA1F2] rounded"
                      />
                      Same as Business Address
                    </label>
                    {!formData.sameAsBiz && (
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          name="postalProvince"
                          value={formData.postalProvince}
                          onChange={handleChange}
                          required={!formData.sameAsBiz}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1EA1F2] outline-none text-sm text-gray-600"
                        >
                          <option value="">Province</option>
                          <option value="Albay">Albay</option>
                        </select>
                        <select
                          name="postalCity"
                          value={formData.postalCity}
                          onChange={handleChange}
                          required={!formData.sameAsBiz}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1EA1F2] outline-none text-sm text-gray-600"
                        >
                          <option value="">Municipality/City</option>
                          <option value="Legazpi">Legazpi</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-[#1EA1F2] text-white font-bold py-2.5 px-4 rounded-xl hover:bg-[#188bd4] transition-all flex justify-center items-center gap-2"
                    >
                      CONTINUE{" "}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                        />
                      </svg>
                    </button>
                    <Link
                      to="/signup"
                      className="flex-1 flex justify-center items-center text-gray-500 font-bold py-2.5 px-4 rounded-xl hover:bg-gray-100 transition-all"
                    >
                      CANCEL
                    </Link>
                  </div>
                </div>
              )}

              {/* ================= STEP 2 ================= */}
              {step === 2 && (
                <div className="space-y-2.5 animate-[fadeIn_0.3s_ease-in-out]">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">
                        First Name
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                        className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1EA1F2] outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">
                        Last Name
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                        className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1EA1F2] outline-none text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">
                        Username{" "}
                        <span className="font-normal text-[9px] text-gray-400 hidden sm:inline">
                          (Letters, numbers, _)
                        </span>
                      </label>
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        pattern="[a-zA-Z0-9_]+"
                        required
                        className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1EA1F2] outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">
                        Gender
                      </label>
                      <div className="flex flex-wrap gap-2 text-[10px] text-gray-600 pt-1">
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            name="gender"
                            value="Male"
                            checked={formData.gender === "Male"}
                            onChange={handleChange}
                            className="text-[#1EA1F2] focus:ring-[#1EA1F2] w-3 h-3"
                            required
                          />{" "}
                          Male
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            name="gender"
                            value="Female"
                            checked={formData.gender === "Female"}
                            onChange={handleChange}
                            className="text-[#1EA1F2] focus:ring-[#1EA1F2] w-3 h-3"
                            required
                          />{" "}
                          Female
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* INLINE VALIDATION FOR STUDENT EMAIL */}
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">
                      Student Email{" "}
                      <span className="font-normal text-gray-400">
                        (Must end in @bicol-u.edu.ph)
                      </span>
                    </label>
                    <input
                      type="email"
                      name="studentEmail"
                      value={formData.studentEmail}
                      onChange={handleChange}
                      required
                      placeholder="e.g., juan.delacruz@bicol-u.edu.ph"
                      className={`w-full px-2.5 py-1.5 bg-gray-50 border rounded-lg focus:ring-2 outline-none text-sm transition-colors ${
                        emailError
                          ? "border-red-500 focus:ring-red-500 bg-red-50"
                          : "border-gray-200 focus:ring-[#1EA1F2]"
                      }`}
                    />
                    {emailError && (
                      <p className="text-red-500 text-[10px] mt-1 font-semibold flex items-center gap-1 animate-in fade-in">
                        <AlertCircle size={12} /> {emailError}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">
                        Phone{" "}
                        <span className="font-normal text-gray-400">
                          (+639XX)
                        </span>
                      </label>
                      <div className="flex">
                        <span className="inline-flex items-center px-2 text-xs text-gray-500 bg-gray-100 border border-r-0 border-gray-200 rounded-l-lg">
                          +63
                        </span>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          maxLength="10"
                          required
                          className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-r-lg focus:ring-2 focus:ring-[#1EA1F2] outline-none text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">
                        Student Number{" "}
                        <span className="font-normal text-gray-400">
                          (20XX-XXXX)
                        </span>
                      </label>
                      <input
                        type="text"
                        name="studentNumber"
                        value={formData.studentNumber}
                        onChange={handleChange}
                        required
                        className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1EA1F2] outline-none text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">
                        Date of birth
                      </label>
                      <div className="grid grid-cols-3 gap-1">
                        <input
                          type="text"
                          name="dobDay"
                          value={formData.dobDay}
                          onChange={handleChange}
                          placeholder="DD"
                          maxLength="2"
                          required
                          className="w-full px-1 py-1.5 text-center bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1EA1F2] outline-none text-sm"
                        />
                        <input
                          type="text"
                          name="dobMonth"
                          value={formData.dobMonth}
                          onChange={handleChange}
                          placeholder="MM"
                          maxLength="2"
                          required
                          className="w-full px-1 py-1.5 text-center bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1EA1F2] outline-none text-sm"
                        />
                        <input
                          type="text"
                          name="dobYear"
                          value={formData.dobYear}
                          onChange={handleChange}
                          placeholder="YYYY"
                          maxLength="4"
                          required
                          className="w-full px-1 py-1.5 text-center bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1EA1F2] outline-none text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">
                        Upload ID{" "}
                        <span className="font-normal text-gray-400">
                          (COR/ID)
                        </span>
                      </label>
                      {/* FIX applied here: removed 'required' from hidden input to allow submission */}
                      <label
                        className={`w-full flex justify-center items-center gap-2 px-2 py-1.5 bg-white border rounded-lg cursor-pointer transition-colors text-sm font-bold ${formData.idFile ? "border-green-500 text-green-600 bg-green-50 hover:bg-green-100" : "border-[#1EA1F2] text-[#1EA1F2] hover:bg-blue-50"}`}
                      >
                        {formData.idFile ? (
                          <span className="flex items-center gap-1 text-[11px] truncate max-w-[100px]">
                            <CheckCircle2 size={14} /> {formData.idFile.name}
                          </span>
                        ) : (
                          <>
                            UPLOAD{" "}
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={2}
                              stroke="currentColor"
                              className="w-4 h-4"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                              />
                            </svg>
                          </>
                        )}
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*,.pdf"
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              idFile: e.target.files[0],
                            })
                          }
                        />
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">
                        Password
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1EA1F2] outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1EA1F2] outline-none text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      className="flex-1 bg-[#1EA1F2] text-white font-bold py-2.5 px-4 rounded-xl hover:bg-[#188bd4] transition-all flex justify-center items-center gap-2 shadow-md"
                    >
                      CONTINUE{" "}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* ================= STEP 3 ================= */}
              {step === 3 && (
                <div className="space-y-6 animate-[fadeIn_0.3s_ease-in-out]">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Allowed Payments
                    </label>
                    <div className="space-y-3 pl-2">
                      <label className="flex items-center gap-3 cursor-pointer text-sm text-gray-700 font-medium hover:text-[#FF851B] transition-colors">
                        <input
                          type="checkbox"
                          name="gcash"
                          checked={formData.payments.gcash}
                          onChange={handlePaymentChange}
                          className="w-4 h-4 text-[#FF851B] focus:ring-[#FF851B] rounded border-gray-300"
                        />{" "}
                        GCash
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer text-sm text-gray-700 font-medium hover:text-[#FF851B] transition-colors">
                        <input
                          type="checkbox"
                          name="paymaya"
                          checked={formData.payments.paymaya}
                          onChange={handlePaymentChange}
                          className="w-4 h-4 text-[#FF851B] focus:ring-[#FF851B] rounded border-gray-300"
                        />{" "}
                        PayMaya
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer text-sm text-gray-700 font-medium hover:text-[#FF851B] transition-colors">
                        <input
                          type="checkbox"
                          name="paypal"
                          checked={formData.payments.paypal}
                          onChange={handlePaymentChange}
                          className="w-4 h-4 text-[#FF851B] focus:ring-[#FF851B] rounded border-gray-300"
                        />{" "}
                        PayPal
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer text-sm text-gray-700 font-medium hover:text-[#FF851B] transition-colors">
                        <input
                          type="checkbox"
                          name="stripe"
                          checked={formData.payments.stripe}
                          onChange={handlePaymentChange}
                          className="w-4 h-4 text-[#FF851B] focus:ring-[#FF851B] rounded border-gray-300"
                        />{" "}
                        Stripe
                      </label>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100 mt-6">
                    <label className="flex items-center justify-center gap-2 cursor-pointer text-xs text-gray-600">
                      <input
                        type="checkbox"
                        name="agreeTerms"
                        checked={formData.agreeTerms}
                        onChange={handleChange}
                        required
                        className="text-[#FF851B] focus:ring-[#FF851B] rounded"
                      />
                      <span>
                        I agree to the{" "}
                        <a
                          href="#"
                          className="text-[#0074D9] font-bold hover:underline"
                        >
                          Terms and Conditions
                        </a>{" "}
                        and{" "}
                        <a
                          href="#"
                          className="text-[#0074D9] font-bold hover:underline"
                        >
                          Privacy Policy
                        </a>
                      </span>
                    </label>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      className="flex-[2] bg-[#FF851B] text-white font-bold py-3 px-4 rounded-xl hover:bg-[#e67616] hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgb(255,133,27,0.3)] transition-all"
                    >
                      CREATE ACCOUNT
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate("/signup")}
                      className="flex-1 flex justify-center items-center text-gray-500 font-bold py-3 px-4 rounded-xl hover:bg-gray-100 transition-all"
                    >
                      CANCEL
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
