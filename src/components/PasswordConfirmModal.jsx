import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function PasswordConfirmModal({ isOpen, title = 'Confirm password to enable two-step verification', onCancel, onConfirm }) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onCancel}></div>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm relative z-10 overflow-hidden border border-gray-100">
        <div className="p-6">
          <h3 className="text-lg font-bold text-[#003366] mb-2">{title}</h3>
          <p className="text-xs text-gray-400 mb-4">Enter your current password to confirm this action.</p>

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none"
              placeholder="Current password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              aria-label="Toggle password visibility"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              onClick={() => {
                setPassword("");
                onConfirm(password);
              }}
              className="flex-1 bg-[#003366] text-white py-2.5 rounded-xl font-bold text-sm"
            >
              Confirm
            </button>
            <button
              onClick={() => { setPassword(""); onCancel(); }}
              className="flex-1 bg-white border border-gray-200 text-gray-600 py-2.5 rounded-xl font-bold text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
