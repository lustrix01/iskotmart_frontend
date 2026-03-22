import React, { useState } from "react";
import {
  Plus,
  MapPin,
  Home,
  Building2,
  Pencil,
  Trash2,
  CheckCircle2,
  Phone,
  Star,
  Info,
} from "lucide-react";

export default function Addresses() {
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

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-xl font-bold text-[#003366]">My addresses</h1>
          <p className="text-xs text-gray-400 mt-1">
            Manage your delivery locations and shipping preferences
          </p>
        </div>
        <button
          onClick={() =>
            handleAction(
              "Add Address",
              "Opening address entry form...",
              "Opening the 'Add New Address' modal form",
            )
          }
          className="flex items-center gap-2 bg-[#003366] text-white px-5 py-2.5 rounded-md text-xs font-bold hover:bg-[#002244] transition-all shadow-md active:scale-95"
        >
          <Plus size={16} />
          Add new address
        </button>
      </div>

      <div className="space-y-4">
        {/* 1. DEFAULT ADDRESS CARD */}
        <div className="bg-[#FFF7F0] border-2 border-[#FF851B] rounded-xl p-8 shadow-sm relative overflow-hidden">
          {/* Default Badge */}
          <div className="absolute top-0 right-0">
            <div className="bg-[#FF851B] text-white px-4 py-1.5 text-[10px] font-bold rounded-bl-xl">
              Default address
            </div>
          </div>

          <div className="flex items-start gap-6">
            <div className="bg-[#FF851B]/10 p-3 rounded-full">
              <Home className="text-[#FF851B]" size={20} />
            </div>

            <div className="flex-grow space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-gray-800">Home</span>
                <span className="text-gray-300">|</span>
                <span className="text-sm font-bold text-gray-800">
                  Owhie Lumbang
                </span>
              </div>

              <div className="text-xs text-gray-500 leading-relaxed max-w-md">
                123 Main Street, Barangay San Jose
                <br />
                Bacoor, Cavite 4102, Philippines
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-400 font-semibold">
                <Phone size={14} className="text-gray-300" />
                09564499020
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() =>
                    handleAction(
                      "Edit",
                      "Loading address details...",
                      "Opening edit form for 'Home' address",
                    )
                  }
                  className="flex items-center gap-1.5 text-xs font-bold text-[#003366] hover:underline"
                >
                  <Pencil size={14} /> Edit
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 2. SECONDARY ADDRESS CARD */}
        <div className="bg-white border border-gray-100 rounded-xl p-8 shadow-sm hover:border-gray-200 transition-all group">
          <div className="flex items-start gap-6">
            <div className="bg-gray-50 p-3 rounded-full group-hover:bg-[#0074D9]/5 transition-colors">
              <Building2
                className="text-gray-400 group-hover:text-[#0074D9]"
                size={20}
              />
            </div>

            <div className="flex-grow space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-gray-800">
                  Boarding House
                </span>
                <span className="text-gray-300">|</span>
                <span className="text-sm font-bold text-gray-800">
                  Owhie Lumbang
                </span>
              </div>

              <div className="text-xs text-gray-500 leading-relaxed max-w-md">
                123 Main Street, Barangay San Jose
                <br />
                Bacoor, Cavite 4102, Philippines
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-400 font-semibold">
                <Phone size={14} className="text-gray-300" />
                09564499020
              </div>

              <div className="flex gap-6 pt-4">
                <button
                  onClick={() =>
                    handleAction(
                      "Edit",
                      "Loading address details...",
                      "Opening edit form for 'Boarding House'",
                    )
                  }
                  className="flex items-center gap-1.5 text-xs font-bold text-[#003366] hover:underline"
                >
                  <Pencil size={14} /> Edit
                </button>
                <button
                  onClick={() =>
                    handleAction(
                      "Delete",
                      "Removing address from your profile...",
                      "Deleting 'Boarding House' from the address table",
                    )
                  }
                  className="flex items-center gap-1.5 text-xs font-bold text-gray-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={14} /> Delete
                </button>
                <button
                  onClick={() =>
                    handleAction(
                      "Set Default",
                      "Setting new primary address...",
                      "Updating database to set 'Boarding House' as default",
                    )
                  }
                  className="flex items-center gap-1.5 text-xs font-bold text-gray-300 hover:text-[#FF851B] transition-colors"
                >
                  <Star size={14} /> Set as default
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- CUSTOM STYLED POPUP --- */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#003366]/20 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={closeModal}
          ></div>

          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm relative z-10 overflow-hidden animate-in zoom-in duration-300 border border-gray-100">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Info size={28} className="text-[#0074D9]" />
              </div>

              <h3 className="text-lg font-bold text-[#003366] mb-2">
                {modal.title}
              </h3>
              <p className="text-gray-500 text-xs mb-8 leading-relaxed">
                {modal.message}
              </p>

              <div className="bg-[#F8FAFC] rounded-xl p-4 mb-8 border border-gray-100 text-left">
                <p className="text-[9px] font-bold text-gray-400 tracking-widest uppercase mb-1">
                  Action taken
                </p>
                <p className="text-[11px] font-semibold text-[#003366] leading-relaxed">
                  {modal.action}
                </p>
              </div>

              <button
                onClick={closeModal}
                className="w-full bg-[#003366] text-white py-3.5 rounded-xl font-bold text-xs hover:bg-[#002244] transition-all shadow-md active:scale-95"
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
