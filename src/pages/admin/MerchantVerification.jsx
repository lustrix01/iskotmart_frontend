import React, { useState } from "react";
import {
  Search,
  Filter,
  Check,
  X,
  Mail,
  Eye,
  FileText,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

export default function MerchantVerification() {
  // --- STATE ---
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [notification, setNotification] = useState(null);

  const [merchants, setMerchants] = useState([
    {
      id: 1,
      name: "TechHub Store",
      owner: "JUAN DELA CRUZ",
      type: "Electronics",
      date: "2026-03-20",
      status: "PENDING",
      documents: [
        "Business Permit.pdf",
        "DTI_Registration.jpg",
        "Valid_ID.png",
      ],
    },
    {
      id: 2,
      name: "Fashion Paradise",
      owner: "MARIA SANTOS",
      type: "Apparel",
      date: "2026-03-21",
      status: "UNDER REVIEW",
      documents: ["Permit_2026.pdf", "Owner_ID.jpg"],
    },
    {
      id: 3,
      name: "HomeDecor Manila",
      owner: "PEDRO PENDUKO",
      type: "Home & Living",
      date: "2026-03-19",
      status: "PENDING",
      documents: ["Business_Docs.zip"],
    },
  ]);

  // --- HANDLERS ---
  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAction = (type) => {
    const name = selectedMerchant.name;
    if (type === "verify") {
      setMerchants((prev) => prev.filter((m) => m.id !== selectedMerchant.id));
      showToast(`${name} has been verified!`);
    } else if (type === "reject") {
      setMerchants((prev) => prev.filter((m) => m.id !== selectedMerchant.id));
      showToast(`Application for ${name} rejected.`);
    } else {
      showToast(`Information request sent to ${name}.`);
    }
    setModalType(null);
    setSelectedMerchant(null);
  };

  const filteredMerchants = merchants.filter(
    (m) =>
      (m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.owner.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (filterStatus === "All" || m.status === filterStatus),
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20 relative">
      {/* --- NOTIFICATION --- */}
      {notification && (
        <div className="fixed top-24 right-8 z-[100] bg-[#003366] text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right">
          <CheckCircle size={18} className="text-green-400" />
          <span className="text-xs font-black uppercase tracking-tight">
            {notification}
          </span>
        </div>
      )}

      {/* --- TOP ACTION BAR (No Title, with Metrics) --- */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2">
        {/* Subtle Verification Metrics */}
        <div className="flex items-center gap-6">
          <SubtleBadge icon={<ShieldCheck size={18} />} label="24 PENDING" />
          <SubtleBadge
            icon={<CheckCircle size={18} />}
            label="15 VERIFIED TODAY"
            color="text-green-500"
          />
          <SubtleBadge
            icon={<AlertCircle size={18} />}
            label="2 DISPUTES"
            color="text-red-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
          {/* Search Bar */}
          <div className="relative flex-grow lg:flex-grow-0">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search merchant..."
              className="pl-12 pr-6 py-3 bg-white border border-gray-100 rounded-2xl text-xs font-semibold text-[#003366] outline-none shadow-sm focus:ring-2 focus:ring-blue-50 w-full lg:w-72 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div className="bg-white px-4 py-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
            <Filter size={16} className="text-gray-400" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Status:
            </span>
            <select
              className="text-xs font-bold text-[#003366] bg-transparent outline-none cursor-pointer"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option>All</option>
              <option>PENDING</option>
              <option>UNDER REVIEW</option>
            </select>
          </div>
        </div>
      </div>

      {/* --- VERIFICATION TABLE --- */}
      <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#F9FAFB] border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-[2px]">
              <tr>
                <th className="px-10 py-5">Merchant Details</th>
                <th className="px-10 py-5">Category</th>
                <th className="px-10 py-5">Date Submitted</th>
                <th className="px-10 py-5">Status</th>
                <th className="px-10 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredMerchants.map((m) => (
                <tr
                  key={m.id}
                  className="group hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 bg-blue-50 text-[#003366] rounded-2xl flex items-center justify-center font-bold">
                        {m.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#003366]">
                          {m.name}
                        </p>
                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-tight">
                          {m.owner}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-6 text-xs font-semibold text-gray-600">
                    {m.type}
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-2 text-[11px] text-gray-400 font-semibold">
                      <FileText size={14} /> {m.date}
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <span
                      className={`px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${m.status === "UNDER REVIEW" ? "bg-blue-50 text-blue-500" : "bg-orange-50 text-orange-400"}`}
                    >
                      {m.status}
                    </span>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <div className="flex justify-end gap-2.5">
                      <button
                        onClick={() => setSelectedMerchant(m)}
                        className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-[#003366] hover:text-white transition-all shadow-sm"
                        title="Review Documents"
                      >
                        <Eye size={16} strokeWidth={3} />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedMerchant(m);
                          handleAction("verify");
                        }}
                        className="p-3 bg-green-50 text-green-500 rounded-xl hover:bg-green-500 hover:text-white transition-all shadow-sm"
                        title="Verify Now"
                      >
                        <Check size={16} strokeWidth={4} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- DOCUMENT SLIDE-OVER (Placeholder logic to ensure it works) --- */}
      {selectedMerchant && (
        <div className="fixed inset-0 z-[110] flex justify-end">
          <div
            className="absolute inset-0 bg-[#003366]/40 backdrop-blur-sm"
            onClick={() => setSelectedMerchant(null)}
          ></div>
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-[#003366]">
                {selectedMerchant.name}
              </h3>
              <button
                onClick={() => setSelectedMerchant(null)}
                className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-grow p-8 overflow-y-auto space-y-6">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Verification Documents
              </p>
              {selectedMerchant.documents.map((doc, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100"
                >
                  <div className="flex items-center gap-4">
                    <FileText size={20} className="text-blue-500" />
                    <p className="text-xs font-bold text-[#003366]">{doc}</p>
                  </div>
                  <ChevronRight size={16} className="text-gray-300" />
                </div>
              ))}
            </div>
            <div className="p-8 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setModalType("reject")}
                className="flex-1 py-4 bg-red-50 text-red-500 rounded-2xl font-bold text-[10px] uppercase hover:bg-red-500 hover:text-white transition-all"
              >
                Reject
              </button>
              <button
                onClick={() => handleAction("verify")}
                className="flex-1 py-4 bg-[#003366] text-white rounded-2xl font-bold text-[10px] uppercase hover:bg-[#002244] shadow-lg"
              >
                Verify Shop
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- SUB-COMPONENTS ---

function SubtleBadge({ icon, label, color = "text-gray-400" }) {
  return (
    <div className="flex items-center gap-3 px-1 transition-all">
      <div className={`${color} bg-opacity-10 p-1.5`}>{icon}</div>
      <span className="text-xs font-bold text-gray-500 uppercase tracking-tighter">
        {label}
      </span>
    </div>
  );
}
