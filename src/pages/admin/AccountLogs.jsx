import React, { useState } from "react";
import {
  Search,
  Filter,
  Clock,
  User,
  Store,
  ShieldCheck,
  Calendar,
  Download,
  RefreshCcw,
  CheckCircle,
  FileText,
  Activity,
  AlertCircle,
  Info,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Globe,
  Smartphone,
} from "lucide-react";

export default function AccountLogs() {
  // --- STATE ---
  const [searchTerm, setSearchTerm] = useState("");
  const [logType, setLogType] = useState("All Logs");
  const [accountType, setAccountType] = useState("All Accounts");
  const [notification, setNotification] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null); // For Modal

  // Enhanced Mock Data with Severity and Metadata
  const [logs, setLogs] = useState([
    {
      id: 1,
      timestamp: "2026-03-22 14:30:05",
      account: "Juan Dela Cruz",
      accType: "Customer",
      logType: "Security",
      severity: "Warning",
      action: "Password Change",
      details:
        "User updated password via email verification from a new device in Cebu, PH.",
      ip: "112.204.15.12",
      device: "Chrome / Windows",
    },
    {
      id: 2,
      timestamp: "2026-03-22 13:15:22",
      account: "TechHub Store",
      accType: "Merchant",
      logType: "Activity",
      severity: "Info",
      action: "Product Upload",
      details: "Uploaded new item: 'IPhone 15 Pro Max' with 50 units in stock.",
      ip: "125.166.22.8",
      device: "Safari / iPhone",
    },
    {
      id: 3,
      timestamp: "2026-03-22 12:05:00",
      account: "Admin_Owhie",
      accType: "Admin",
      logType: "System",
      severity: "Danger",
      action: "Status Change",
      details:
        "Deactivated moderator account: 'Sarah Jenkins' due to policy violation.",
      ip: "192.168.1.1",
      device: "Firefox / MacOS",
    },
    {
      id: 4,
      timestamp: "2026-03-21 22:45:10",
      account: "Maria Santos",
      accType: "Customer",
      logType: "Auth",
      severity: "Info",
      action: "Login",
      details: "Login success from IP 192.168.1.45 (Manila, PH).",
      ip: "192.168.1.45",
      device: "Chrome / Android",
    },
    {
      id: 5,
      timestamp: "2026-03-21 20:10:33",
      account: "Fashion Express",
      accType: "Merchant",
      logType: "Finance",
      severity: "Warning",
      action: "Withdrawal Request",
      details: "Requested payout of ₱15,200.00. Pending admin approval.",
      ip: "49.145.201.11",
      device: "Edge / Windows",
    },
  ]);

  // --- HANDLERS ---
  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleExport = () => {
    showToast("Exporting logs to CSV...");
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.account.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLogType = logType === "All Logs" || log.logType === logType;
    const matchesAccType =
      accountType === "All Accounts" || log.accType === accountType;

    return matchesSearch && matchesLogType && matchesAccType;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20 relative px-4 md:px-0">
      {/* --- NOTIFICATION --- */}
      {notification && (
        <div className="fixed top-24 right-8 z-[100] bg-[#003366] text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right">
          <CheckCircle size={18} className="text-green-400" />
          <span className="text-xs font-semibold">{notification}</span>
        </div>
      )}

      {/* --- DETAIL MODAL --- */}
      {selectedLog && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] w-full max-w-lg p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-lg font-bold text-[#003366]">
                Log Entry Details
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <DetailItem
                  label="Timestamp"
                  value={selectedLog.timestamp}
                  icon={<Clock size={14} />}
                />
                <DetailItem
                  label="IP Address"
                  value={selectedLog.ip}
                  icon={<Globe size={14} />}
                />
                <DetailItem
                  label="User Agent"
                  value={selectedLog.device}
                  icon={<Smartphone size={14} />}
                />
                <DetailItem label="Action" value={selectedLog.action} />
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">
                  Detailed Description
                </p>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {selectedLog.details}
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedLog(null)}
              className="w-full mt-8 py-3 bg-[#003366] text-white rounded-xl text-xs font-bold hover:bg-[#002244] transition-all"
            >
              Close Details
            </button>
          </div>
        </div>
      )}

      {/* --- TOP BAR --- */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2">
        <div className="flex flex-wrap items-center gap-4">
          <SubtleBadge
            icon={<Activity size={18} />}
            label={`${logs.length} Total Logs`}
          />
          <SubtleBadge
            icon={<AlertCircle size={18} />}
            label="2 Warnings"
            color="text-orange-500"
          />
          <button
            onClick={handleExport}
            className="flex items-center gap-2 text-[10px] font-bold text-blue-500 uppercase hover:text-blue-600 transition-colors bg-blue-50 px-3 py-1.5 rounded-lg"
          >
            <Download size={12} /> Export CSV
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-grow lg:flex-grow-0">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Search ID, account, or action..."
              className="pl-10 pr-6 py-2.5 bg-white border border-gray-100 rounded-2xl text-xs font-semibold text-[#003366] outline-none shadow-sm focus:ring-2 focus:ring-blue-50 w-full lg:w-64 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <FilterSelect
            label="Type"
            value={logType}
            onChange={setLogType}
            options={[
              "All Logs",
              "Security",
              "Activity",
              "System",
              "Auth",
              "Finance",
            ]}
          />
          <FilterSelect
            label="Account"
            value={accountType}
            onChange={setAccountType}
            options={["All Accounts", "Customer", "Merchant", "Admin"]}
          />
        </div>
      </div>

      {/* --- LOGS TABLE --- */}
      <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#F9FAFB] border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-[2px]">
              <tr>
                <th className="px-8 py-5">Severity</th>
                <th className="px-8 py-5">Timestamp</th>
                <th className="px-8 py-5">Account</th>
                <th className="px-8 py-5">Action</th>
                <th className="px-8 py-5">Details</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-slate-50/50 transition-colors group"
                >
                  <td className="px-8 py-6">
                    <SeverityBadge severity={log.severity} />
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400">
                      <Clock size={12} /> {log.timestamp}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${log.accType === "Merchant" ? "bg-blue-50 text-blue-500" : "bg-orange-50 text-orange-500"}`}
                      >
                        {log.accType === "Merchant" ? (
                          <Store size={14} />
                        ) : (
                          <User size={14} />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#003366]">
                          {log.account}
                        </p>
                        <p className="text-[9px] text-gray-400 font-bold uppercase">
                          {log.accType}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-[#003366] block">
                        {log.action}
                      </span>
                      <span className="text-[9px] text-gray-300 font-bold uppercase">
                        {log.logType}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-xs text-gray-400 font-medium leading-relaxed max-w-[200px] truncate">
                      {log.details}
                    </p>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-2 hover:bg-blue-50 text-blue-500 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className="p-2 hover:bg-red-50 text-red-400 rounded-lg transition-colors"
                        title="Delete Log"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* --- PAGINATION FOOTER --- */}
        <div className="bg-[#F9FAFB] px-8 py-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Showing {filteredLogs.length} of {logs.length} entries
          </p>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:bg-white transition-all cursor-not-allowed">
              <ChevronLeft size={16} />
            </button>
            <div className="flex gap-1">
              <button className="w-8 h-8 rounded-xl bg-[#003366] text-white text-[10px] font-bold">
                1
              </button>
              <button className="w-8 h-8 rounded-xl bg-white border border-gray-200 text-gray-400 text-[10px] font-bold hover:border-blue-300">
                2
              </button>
            </div>
            <button className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:bg-white transition-all">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {filteredLogs.length === 0 && (
          <div className="py-20 text-center space-y-3">
            <FileText size={40} className="mx-auto text-gray-100" />
            <p className="text-gray-300 font-bold italic text-sm">
              No log entries found.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function SeverityBadge({ severity }) {
  const styles = {
    Info: "bg-blue-50 text-blue-500 border-blue-100",
    Warning: "bg-orange-50 text-orange-500 border-orange-100",
    Danger: "bg-red-50 text-red-500 border-red-100",
  };
  return (
    <div
      className={`px-2 py-1 rounded-md border text-[9px] font-black uppercase text-center w-20 ${styles[severity] || styles.Info}`}
    >
      {severity}
    </div>
  );
}

function DetailItem({ label, value, icon }) {
  return (
    <div>
      <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">
        {label}
      </p>
      <div className="flex items-center gap-2 text-xs font-bold text-[#003366]">
        {icon} {value}
      </div>
    </div>
  );
}

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
    <div className="bg-white px-4 py-2.5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
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
