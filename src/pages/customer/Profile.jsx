import React, { useState } from "react";
import { Camera, CheckCircle2, X, Bell } from "lucide-react";

export default function Profile() {
  // Modal State for Custom Notifications
  const [modal, setModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    action: "",
  });

  const handleAction = (title, message, action) => {
    setModal({
      isOpen: true,
      title,
      message,
      action,
    });
  };

  const closeModal = () => setModal({ ...modal, isOpen: false });

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-[#003366]">
          Profile information
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Manage and protect your account details
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-10">
        {/* User Header Section */}
        <div className="flex items-center gap-8 mb-12">
          <div className="relative shrink-0">
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-[#F5F7F9] bg-gray-50 flex items-center justify-center">
              <img
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Owhie"
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            <button
              onClick={() =>
                handleAction(
                  "Update Photo",
                  "Select a new image from your files.",
                  "Open gallery to update profile picture",
                )
              }
              className="absolute bottom-1 right-1 bg-[#003366] text-white p-2 rounded-full shadow-lg border-2 border-white hover:bg-[#FF851B] transition-all"
            >
              <Camera size={14} />
            </button>
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-gray-800">Owhie Lumbang</h2>
            <p className="text-sm text-gray-400 font-medium">
              owhie.lumbang@email.com
            </p>
            <p className="text-[10px] text-gray-300 font-bold tracking-wider">
              Member since March 2025
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-3 gap-6 mb-12">
          {[
            { label: "Total orders", val: "24" },
            { label: "Total spent", val: "₱128,450" },
            { label: "Wishlist items", val: "8" },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-[#F8FAFC] py-8 rounded-xl border border-gray-50 flex flex-col items-center justify-center"
            >
              <span className="text-3xl font-bold text-[#FF851B] tracking-tight">
                {stat.val}
              </span>
              <span className="text-[10px] font-bold text-gray-400 tracking-widest mt-2">
                {stat.label}
              </span>
            </div>
          ))}
        </div>

        {/* Account Form - All original fields preserved */}
        <form className="grid grid-cols-2 gap-x-10 gap-y-8">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-gray-500 tracking-wide ml-1">
              First name
            </label>
            <input
              type="text"
              defaultValue="Owhie"
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:border-[#003366] transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-gray-500 tracking-wide ml-1">
              Last name
            </label>
            <input
              type="text"
              defaultValue="Lumbang"
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:border-[#003366] transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-gray-500 tracking-wide ml-1">
              Email address
            </label>
            <input
              type="email"
              defaultValue="owhie.lumbang@email.com"
              className="w-full px-4 py-3 bg-[#F8FAFC] border border-gray-200 rounded-md text-sm text-gray-400 cursor-not-allowed"
              disabled
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-gray-500 tracking-wide ml-1">
              Phone number
            </label>
            <input
              type="text"
              defaultValue="09564499020"
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:border-[#003366] transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-gray-500 tracking-wide ml-1">
              Date of birth
            </label>
            <input
              type="date"
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:border-[#003366] transition-all text-gray-600"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-gray-500 tracking-wide ml-1">
              Gender
            </label>
            <select className="w-full px-4 py-3 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:border-[#003366] transition-all text-gray-600">
              <option>Male</option>
              <option>Female</option>
              <option>Prefer not to say</option>
            </select>
          </div>

          <div className="col-span-2 pt-6 mt-4 border-t border-gray-50">
            <button
              type="button"
              onClick={() =>
                handleAction(
                  "Success",
                  "Your profile information has been saved.",
                  "Save changes - Your updated profile information has been submitted to the database.",
                )
              }
              className="bg-[#FF851B] text-white px-10 py-3.5 rounded-lg font-bold text-sm hover:bg-[#E67616] shadow-lg shadow-orange-100 transition-all active:scale-95"
            >
              Save changes
            </button>
          </div>
        </form>
      </div>

      {/* --- CUSTOM STYLED NOTIFICATION POPUP --- */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          {/* Subtle Backdrop Blur */}
          <div
            className="absolute inset-0 bg-[#003366]/20 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={closeModal}
          ></div>

          {/* Notification Card */}
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm relative z-10 overflow-hidden animate-in zoom-in duration-300 border border-gray-100">
            <div className="p-8">
              {/* Branded Header Icon */}
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

                {/* Styled "Action Taken" Box */}
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

            {/* Minimal IskoMart Accent */}
            <div className="h-1 bg-gradient-to-r from-[#0074D9] to-[#FF851B] w-full"></div>
          </div>
        </div>
      )}
    </div>
  );
}
