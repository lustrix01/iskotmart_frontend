import React, { useState } from "react";
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  Bell,
  ShieldCheck,
} from "lucide-react";

export default function ChangePassword() {
  const [showPass, setShowPass] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Modal State for custom notifications
  const [modal, setModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    action: "",
  });

  const handleAction = (title, message, action) => {
    setModal({ isOpen: true, title, message, action });
  };

  const closeModal = () => setModal({ ...modal, isOpen: false });

  const toggleVisibility = (field) => {
    setShowPass((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-xl font-bold text-[#003366]">Change password</h1>
        <p className="text-xs text-gray-400 mt-1">
          For your account's security, do not share your password with others
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Password Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10">
            <form className="space-y-6">
              {/* Current Password */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-500 tracking-wide ml-1">
                  Current password
                </label>
                <div className="relative">
                  <input
                    type={showPass.current ? "text" : "password"}
                    placeholder="Enter current password"
                    className="w-full pl-4 pr-12 py-3 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:border-[#003366] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => toggleVisibility("current")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#003366] transition-colors"
                  >
                    {showPass.current ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-500 tracking-wide ml-1">
                  New password
                </label>
                <div className="relative">
                  <input
                    type={showPass.new ? "text" : "password"}
                    placeholder="Enter new password"
                    className="w-full pl-4 pr-12 py-3 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:border-[#003366] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => toggleVisibility("new")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#003366] transition-colors"
                  >
                    {showPass.new ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-500 tracking-wide ml-1">
                  Confirm new password
                </label>
                <div className="relative">
                  <input
                    type={showPass.confirm ? "text" : "password"}
                    placeholder="Repeat new password"
                    className="w-full pl-4 pr-12 py-3 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:border-[#003366] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => toggleVisibility("confirm")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#003366] transition-colors"
                  >
                    {showPass.confirm ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-50 flex justify-between items-center">
                <button
                  type="button"
                  className="text-xs font-bold text-[#0074D9] hover:underline"
                >
                  Forgot password?
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleAction(
                      "Success",
                      "Your password has been updated.",
                      "Encryption Check -> Update Auth Database -> Trigger Session Refresh",
                    )
                  }
                  className="bg-[#FF851B] text-white px-10 py-3 rounded-lg font-bold text-sm hover:bg-[#E67616] shadow-lg shadow-orange-100 transition-all active:scale-95"
                >
                  Update password
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right: Security Tips */}
        <div className="space-y-6">
          <div className="bg-[#F8FAFC] border border-gray-100 rounded-xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <ShieldCheck className="text-[#003366]" size={20} />
              <h3 className="text-sm font-bold text-[#003366]">
                Security tips
              </h3>
            </div>
            <ul className="space-y-4">
              {[
                "Use at least 8 characters",
                "Include a mix of letters and numbers",
                "Add a special character (e.g., ! @ #)",
                "Avoid using your name or birthdate",
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0"></div>
                  <span className="text-[11px] text-gray-500 font-medium leading-relaxed">
                    {tip}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-6 border border-dashed border-gray-200 rounded-xl text-center">
            <p className="text-[10px] text-gray-400 font-medium leading-relaxed">
              Changing your password will log you out from all other active
              devices for security.
            </p>
          </div>
        </div>
      </div>

      {/* --- CUSTOM STYLED NOTIFICATION POPUP --- */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#003366]/20 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={closeModal}
          ></div>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm relative z-10 overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8">
              <div className="flex justify-center mb-6">
                <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center">
                  <CheckCircle2 size={28} className="text-green-500" />
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-[#003366] mb-2">
                  {modal.title}
                </h3>
                <p className="text-gray-500 text-xs mb-8 leading-relaxed">
                  {modal.message}
                </p>
                <div className="bg-[#F8FAFC] rounded-xl p-4 mb-8 border border-gray-100 text-left">
                  <div className="flex items-center gap-2 mb-1.5 opacity-40">
                    <Bell size={10} className="text-[#003366]" />
                    <span className="text-[9px] font-bold text-[#003366] tracking-widest uppercase">
                      Action taken
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-[#003366] leading-relaxed">
                    {modal.action}
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="w-full bg-[#003366] text-white py-3.5 rounded-xl font-bold text-xs hover:bg-[#002244] transition-all shadow-md active:scale-95"
                >
                  Continue
                </button>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-[#0074D9] to-[#FF851B] w-full"></div>
          </div>
        </div>
      )}
    </div>
  );
}
