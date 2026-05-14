import React, { useState } from "react";
import {
  Shield,
  Save,
  AlertCircle,
} from "lucide-react";

export default function Preferences() {
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

  // Local state mirrors currently supported preferences only.
  const [prefs, setPrefs] = useState({
    publicProfile: true,
  });

  const togglePref = (key) => {
    setPrefs({ ...prefs, [key]: !prefs[key] });
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#003366]">
          Account preferences
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Manage privacy settings available in the current release
        </p>
      </div>

      <div className="space-y-4">
        {/* Section: Privacy & Security */}
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-3 bg-gray-50/20">
            <Shield size={18} className="text-[#003366]" />
            <h2 className="text-sm font-bold text-[#003366]">
              Privacy & Visibility
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <PreferenceItem
              title="Public profile"
              desc="Allow other students to see your ratings and joined date"
              active={prefs.publicProfile}
              onToggle={() => togglePref("publicProfile")}
            />
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-gray-500 tracking-wide ml-1">
                Preferred campus branch
              </label>
              <select className="w-full max-w-xs px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-[#003366] transition-all">
                <option>BU Main Campus</option>
                <option>BU East Campus</option>
                <option>BU Daraga Campus</option>
                <option>BU Polangui Campus</option>
              </select>
            </div>
          </div>
        </div>

        {/* Save Button Area */}
        <div className="pt-4 flex justify-end">
          <button
            onClick={() =>
              handleAction(
                "Preferences Saved",
                "Your settings have been updated.",
                "Updating profile visibility preferences for your account",
              )
            }
            className="flex items-center gap-2 bg-[#FF851B] text-white px-8 py-3 rounded-xl font-bold text-xs shadow-lg hover:bg-[#E67616] transition-all active:scale-95"
          >
            <Save size={16} />
            Save changes
          </button>
        </div>
      </div>

      {/* --- CUSTOM POPUP MODAL --- */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#003366]/20 backdrop-blur-sm animate-in fade-in"
            onClick={closeModal}
          ></div>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm relative z-10 overflow-hidden animate-in zoom-in duration-300 border border-gray-100">
            <div className="p-8 text-center">
              <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={28} className="text-[#0074D9]" />
              </div>
              <h3 className="text-lg font-bold text-[#003366] mb-1">
                {modal.title}
              </h3>
              <p className="text-gray-400 text-[11px] mb-6 leading-relaxed">
                {modal.message}
              </p>

              <div className="bg-[#F8FAFC] rounded-xl p-4 mb-6 border border-gray-100 text-left">
                <div className="flex items-center gap-2 mb-1.5 opacity-40 text-[#003366]">
                  <span className="text-[9px] font-bold tracking-widest uppercase">
                    Action taken
                  </span>
                </div>
                <p className="text-[10px] font-medium text-[#003366] leading-relaxed">
                  {modal.action}
                </p>
              </div>

              <button
                onClick={closeModal}
                className="w-full bg-[#003366] text-white py-3.5 rounded-xl font-bold text-xs shadow-md hover:bg-[#002244] transition-all active:scale-95"
              >
                Understood
              </button>
            </div>
            <div className="h-1 bg-gradient-to-r from-[#0074D9] to-[#FF851B] w-full"></div>
          </div>
        </div>
      )}
    </div>
  );
}

// Reusable Preference Item Component
function PreferenceItem({ title, desc, active, onToggle }) {
  return (
    <div className="flex justify-between items-center gap-4">
      <div className="flex-grow">
        <h4 className="text-sm font-semibold text-gray-800">{title}</h4>
        <p className="text-[11px] text-gray-400 font-medium leading-relaxed mt-0.5">
          {desc}
        </p>
      </div>
      <button
        onClick={onToggle}
        className={`shrink-0 w-11 h-6 rounded-full transition-all relative ${active ? "bg-[#FF851B]" : "bg-gray-200"}`}
      >
        <div
          className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${active ? "right-1" : "left-1"}`}
        ></div>
      </button>
    </div>
  );
}
