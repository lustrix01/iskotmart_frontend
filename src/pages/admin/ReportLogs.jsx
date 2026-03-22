import React, { useState } from "react";
import {
  Search,
  Filter,
  Eye,
  Trash2,
  ShieldAlert,
  CheckCircle,
  X,
  AlertTriangle,
  Flag,
  FileSearch,
  ChevronRight,
  Clock,
  Calendar,
} from "lucide-react";

export default function ReportLogs() {
  // --- STATE ---
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPriority, setFilterPriority] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [selectedReport, setSelectedReport] = useState(null); // For Investigation Slide-over
  const [notification, setNotification] = useState(null);

  const [reports, setReports] = useState([
    {
      id: 101,
      reportedItem: "IPhone 15 Pro Max",
      type: "Fake Product",
      reporter: "Juan D.",
      priority: "High",
      date: "2026-03-20",
      status: "Pending",
      detail:
        "The seller is using stock photos and the price is suspiciously low for a brand new unit.",
    },
    {
      id: 102,
      reportedItem: "Fashion Paradise Shop",
      type: "Inappropriate Content",
      reporter: "Maria S.",
      priority: "Medium",
      date: "2026-03-21",
      status: "Investigating",
      detail: "Shop banner contains offensive imagery not related to apparel.",
    },
    {
      id: 103,
      reportedItem: "User Review #992",
      type: "False Review",
      reporter: "System Bot",
      priority: "Low",
      date: "2026-03-19",
      status: "Pending",
      detail:
        "Spam detection triggered: multiple identical reviews posted within 5 seconds.",
    },
    {
      id: 104,
      reportedItem: "Nike Air Jordan 1",
      type: "Counterfeit Item",
      reporter: "Mark A.",
      priority: "High",
      date: "2026-03-22",
      status: "Pending",
      detail:
        "Customer received the item and confirmed it is a class-A replica, not original as advertised.",
    },
  ]);

  // --- HANDLERS ---
  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const updateStatus = (id, newStatus) => {
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r)),
    );
    showToast(`Report #${id} marked as ${newStatus}`);
    if (selectedReport) setSelectedReport(null);
  };

  const removeContent = (id, item) => {
    setReports((prev) => prev.filter((r) => r.id !== id));
    showToast(`Content removed: ${item}`);
    setSelectedReport(null);
  };

  const filteredReports = reports.filter(
    (r) =>
      (r.reportedItem.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.type.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (filterPriority === "All" || r.priority === filterPriority) &&
      (filterStatus === "All" || r.status === filterStatus),
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20 relative">
      {/* --- TOAST --- */}
      {notification && (
        <div className="fixed top-24 right-8 z-[100] bg-[#003366] text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right">
          <CheckCircle size={18} className="text-green-400" />
          <span className="text-xs font-semibold">{notification}</span>
        </div>
      )}

      {/* --- REFINED ACTION BAR --- */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2">
        {/* Subtle Metrics */}
        <div className="flex items-center gap-6">
          <SubtleBadge
            icon={<Flag size={18} />}
            label={`${reports.length} Total Reports`}
          />
          <SubtleBadge
            icon={<AlertTriangle size={18} />}
            label={`${reports.filter((r) => r.priority === "High").length} High Priority`}
            color="text-red-500"
          />
          <SubtleBadge
            icon={<ShieldAlert size={18} />}
            label={`${reports.filter((r) => r.status === "Pending").length} Pending`}
            color="text-orange-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Search */}
          <div className="relative flex-grow lg:flex-grow-0">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Search item or reason..."
              className="pl-10 pr-6 py-2.5 bg-white border border-gray-100 rounded-2xl text-xs font-semibold text-[#003366] outline-none shadow-sm focus:ring-2 focus:ring-blue-50 w-full lg:w-64 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filters */}
          <FilterSelect
            value={filterPriority}
            onChange={setFilterPriority}
            options={["All", "High", "Medium", "Low"]}
            label="Priority"
          />
          <FilterSelect
            value={filterStatus}
            onChange={setFilterStatus}
            options={["All", "Pending", "Investigating", "Resolved"]}
            label="Status"
          />
        </div>
      </div>

      {/* --- REPORTS TABLE --- */}
      <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[#F9FAFB] border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-[2px]">
            <tr>
              <th className="px-10 py-5">Reported Content</th>
              <th className="px-10 py-5">Reason</th>
              <th className="px-10 py-5">Priority</th>
              <th className="px-10 py-5">Status</th>
              <th className="px-10 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredReports.map((r) => (
              <tr
                key={r.id}
                className="group hover:bg-slate-50/50 transition-colors"
              >
                <td className="px-10 py-6">
                  <p className="text-sm font-bold text-[#003366]">
                    {r.reportedItem}
                  </p>
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-tight">
                    ID: #{r.id} • Reporter: {r.reporter}
                  </p>
                </td>
                <td className="px-10 py-6">
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                    <AlertTriangle size={14} className="text-orange-400" />{" "}
                    {r.type}
                  </div>
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-tighter mt-1">
                    {r.date}
                  </p>
                </td>
                <td className="px-10 py-6">
                  <span
                    className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest ${r.priority === "High" ? "bg-red-50 text-red-500" : r.priority === "Medium" ? "bg-blue-50 text-blue-500" : "bg-gray-50 text-gray-400"}`}
                  >
                    {r.priority}
                  </span>
                </td>
                <td className="px-10 py-6">
                  <span
                    className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest ${r.status === "Investigating" ? "bg-blue-50 text-blue-500" : "bg-orange-50 text-orange-400"}`}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="px-10 py-6 text-right">
                  <div className="flex justify-end gap-2">
                    <ActionBtn
                      onClick={() => setSelectedReport(r)}
                      icon={<FileSearch size={16} />}
                      title="Investigate"
                    />
                    <ActionBtn
                      onClick={() => updateStatus(r.id, "Resolved")}
                      icon={<CheckCircle size={16} />}
                      color="green"
                      title="Dismiss"
                    />
                    <ActionBtn
                      onClick={() => removeContent(r.id, r.reportedItem)}
                      icon={<Trash2 size={16} />}
                      color="red"
                      title="Remove Content"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- INVESTIGATION SLIDE-OVER --- */}
      {selectedReport && (
        <div className="fixed inset-0 z-[110] flex justify-end">
          <div
            className="absolute inset-0 bg-[#003366]/40 backdrop-blur-sm"
            onClick={() => setSelectedReport(null)}
          ></div>
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center">
                  <ShieldAlert size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#003366]">
                    Report Investigation
                  </h3>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Case #{selectedReport.id}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-2 text-gray-300 hover:bg-gray-100 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-grow p-8 overflow-y-auto space-y-8">
              <section className="space-y-4">
                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[2px]">
                  Report Summary
                </p>
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-tighter mb-1">
                    Reason for Flag
                  </p>
                  <p className="text-sm font-bold text-[#003366] mb-4">
                    {selectedReport.type}
                  </p>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-tighter mb-1">
                    Description/Evidence
                  </p>
                  <p className="text-xs font-medium text-gray-600 leading-relaxed italic">
                    "{selectedReport.detail}"
                  </p>
                </div>
              </section>

              <section className="space-y-4">
                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[2px]">
                  Log Details
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <InfoItem
                    label="Reported Item"
                    value={selectedReport.reportedItem}
                  />
                  <InfoItem
                    label="Priority Level"
                    value={selectedReport.priority}
                  />
                  <InfoItem label="Date Filed" value={selectedReport.date} />
                  <InfoItem label="Reporter" value={selectedReport.reporter} />
                </div>
              </section>
            </div>

            <div className="p-8 border-t border-gray-100 grid grid-cols-2 gap-3">
              <button
                onClick={() => updateStatus(selectedReport.id, "Investigating")}
                className="py-4 bg-blue-50 text-blue-600 rounded-2xl font-bold text-[10px] uppercase hover:bg-blue-600 hover:text-white transition-all"
              >
                Mark Investigating
              </button>
              <button
                onClick={() =>
                  removeContent(selectedReport.id, selectedReport.reportedItem)
                }
                className="py-4 bg-red-50 text-red-500 rounded-2xl font-bold text-[10px] uppercase hover:bg-red-500 hover:text-white transition-all"
              >
                Delete Content
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
    <div className="flex items-center gap-3 px-1">
      <div className={`${color} bg-opacity-10 p-1.5`}>{icon}</div>
      <span className="text-xs font-bold text-gray-500 uppercase tracking-tighter">
        {label}
      </span>
    </div>
  );
}

function FilterSelect({ label, value, options, onChange }) {
  return (
    <div className="bg-white px-4 py-2 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
        {label}:
      </span>
      <select
        className="text-xs font-bold text-[#003366] bg-transparent outline-none cursor-pointer"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

function ActionBtn({ icon, onClick, color = "blue", title }) {
  const styles = {
    blue: "bg-gray-50 text-gray-400 hover:bg-[#003366] hover:text-white",
    green: "bg-green-50 text-green-500 hover:bg-green-500 hover:text-white",
    red: "bg-red-50 text-red-500 hover:bg-red-500 hover:text-white",
  };
  return (
    <button
      onClick={onClick}
      className={`p-3 rounded-2xl transition-all active:scale-95 shadow-sm ${styles[color]}`}
      title={title}
    >
      {icon}
    </button>
  );
}

function InfoItem({ label, value }) {
  return (
    <div>
      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter mb-1">
        {label}
      </p>
      <p className="text-xs font-bold text-[#003366]">{value}</p>
    </div>
  );
}
