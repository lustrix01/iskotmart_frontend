import React, { useState } from "react";
import {
  ShieldCheck,
  Store,
  AlertTriangle,
  Flag,
  Check,
  X,
  Plus,
  Save,
  CheckCircle,
  Search,
  ArrowUpRight,
} from "lucide-react";

export default function AdminDashboard() {
  // --- NOTIFICATION SYSTEM ---
  const [notification, setNotification] = useState(null);
  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // --- COMPONENT STATES ---
  const [stats, setStats] = useState({
    pending: 24,
    merchants: 1234,
    reports: 23,
    reviews: 53,
  });

  const [verifications, setVerifications] = useState([
    { id: 1, name: "TechHub Store", time: "2 hours ago" },
    { id: 2, name: "Fashion Paradise", time: "3 hours ago" },
    { id: 3, name: "HomeDecor", time: "4 hours ago" },
    { id: 4, name: "MyLoves", time: "5 hours ago" },
  ]);

  const [flaggedContent, setFlaggedContent] = useState([
    { id: 101, type: "Fake Product", priority: "High", shop: "Beauty Shop" },
    {
      id: 102,
      type: "False Review",
      priority: "Medium",
      shop: "Electronic Store",
    },
    { id: 103, type: "Spam Listing", priority: "Low", shop: "Fashion Store" },
    {
      id: 104,
      type: "Fake Product",
      priority: "Medium",
      shop: "Fashion Store",
    },
  ]);

  const [moderators, setModerators] = useState([
    {
      id: 1,
      name: "Owhie S. Lumbang",
      email: "osl2023-5510-65059@bicol-u.edup.ph",
      lastActive: "2 hours ago",
    },
    {
      id: 2,
      name: "Mark Anthony",
      email: "ma2023-4420@bicol-u.edup.ph",
      lastActive: "5 hours ago",
    },
  ]);

  const [costs, setCosts] = useState({
    commission: "5",
    fee1: "2",
    fee2: "1.5",
  });

  // --- HANDLERS ---
  const handleVerify = (id, name, listType) => {
    if (listType === "merch")
      setVerifications((prev) => prev.filter((i) => i.id !== id));
    if (listType === "content")
      setFlaggedContent((prev) => prev.filter((i) => i.id !== id));
    if (listType === "mod")
      setModerators((prev) => prev.filter((i) => i.id !== id));
    showToast(`Approved: ${name}`);
  };

  const handleReject = (id, name, listType) => {
    if (listType === "merch")
      setVerifications((prev) => prev.filter((i) => i.id !== id));
    if (listType === "content")
      setFlaggedContent((prev) => prev.filter((i) => i.id !== id));
    if (listType === "mod")
      setModerators((prev) => prev.filter((i) => i.id !== id));
    showToast(`Rejected: ${name}`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20 relative">
      {/* --- FLOATING NOTIFICATION --- */}
      {notification && (
        <div className="fixed top-24 right-8 z-[100] bg-[#003366] text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right">
          <CheckCircle size={18} className="text-green-400" />
          <span className="text-xs font-black uppercase tracking-tight">
            {notification}
          </span>
        </div>
      )}

      {/* --- TOP STAT CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Pending Verification"
          value={stats.pending}
          trend="+ 5 today"
          icon={<ShieldCheck size={26} />}
          color="orange"
        />
        <StatCard
          title="Active Merchants"
          value={stats.merchants.toLocaleString()}
          trend="+ 245 today"
          icon={<Store size={26} />}
          color="blue"
        />
        <StatCard
          title="Unresolved Reports"
          value={stats.reports}
          trend="5 urgent"
          icon={<AlertTriangle size={26} />}
          color="red"
        />
        <StatCard
          title="Flagged Reviews"
          value={stats.reviews}
          trend="Needs review"
          icon={<Flag size={26} />}
          color="orange"
        />
      </div>

      {/* --- VERIFICATION & FLAGGED ROW --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Verification Card */}
        <DashboardTable
          title="Pending Verification"
          data={verifications}
          renderRow={(item) => (
            <tr
              key={item.id}
              className="group hover:bg-slate-50/50 transition-colors"
            >
              <td className="py-4 px-6">
                <p className="text-xs font-black text-[#003366]">{item.name}</p>
                <p className="text-[9px] text-gray-400 font-bold uppercase mt-0.5">
                  Submitted {item.time}
                </p>
              </td>
              <td className="py-4 px-6">
                <span className="bg-orange-50 text-orange-500 px-3 py-1 rounded-full text-[9px] font-black uppercase">
                  Pending
                </span>
              </td>
              <td className="py-4 px-6 text-right">
                <ActionButtons
                  onVerify={() => handleVerify(item.id, item.name, "merch")}
                  onReject={() => handleReject(item.id, item.name, "merch")}
                />
              </td>
            </tr>
          )}
        />

        {/* Flagged Content Card */}
        <DashboardTable
          title="Flagged Content"
          data={flaggedContent}
          renderRow={(item) => (
            <tr
              key={item.id}
              className="group hover:bg-slate-50/50 transition-colors"
            >
              <td className="py-4 px-6">
                <p className="text-xs font-black text-[#003366]">{item.type}</p>
                <p className="text-[9px] text-gray-400 font-bold uppercase mt-0.5">
                  {item.shop}
                </p>
              </td>
              <td className="py-4 px-6">
                <span
                  className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${item.priority === "High" ? "bg-red-50 text-red-500" : "bg-blue-50 text-blue-500"}`}
                >
                  {item.priority}
                </span>
              </td>
              <td className="py-4 px-6 text-right">
                <ActionButtons
                  onVerify={() => handleVerify(item.id, item.type, "content")}
                  onReject={() => handleReject(item.id, item.type, "content")}
                />
              </td>
            </tr>
          )}
        />
      </div>

      {/* --- ACCOUNT ACTIVITY CHART --- */}
      <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm">
        <div className="flex justify-between items-center mb-10">
          <h3 className="font-black text-[#003366] text-sm uppercase tracking-widest">
            Account Activity
          </h3>
          <select className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-[10px] font-black text-[#003366] outline-none cursor-pointer">
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
          </select>
        </div>
        <div className="h-[250px] w-full relative">
          <svg
            className="w-full h-full overflow-visible"
            viewBox="0 0 1000 250"
            preserveAspectRatio="none"
          >
            <path
              d="M0,200 Q150,180 300,210 T600,150 T900,100 T1000,120 L1000,250 L0,250 Z"
              fill="#003366"
              opacity="0.05"
            />
            <path
              d="M0,200 Q150,180 300,210 T600,150 T900,100 T1000,120"
              fill="none"
              stroke="#003366"
              strokeWidth="4"
            />
            <path
              d="M0,230 Q150,220 300,240 T600,200 T900,180 T1000,200"
              fill="none"
              stroke="#FF851B"
              strokeWidth="3"
              strokeDasharray="6"
            />
          </svg>
        </div>
      </div>

      {/* --- OPERATIONAL COSTS --- */}
      <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-sm font-black text-[#003366] uppercase tracking-widest">
            Operational Cost Settings
          </h3>
          <button
            onClick={() => showToast("Settings Saved")}
            className="bg-[#FF851B] text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-orange-500/20 hover:scale-105 transition-all"
          >
            Save Changes
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <InputGroup
            label="Platform Commission (%)"
            sub="Percentage taken from each transaction"
            value={costs.commission}
            onChange={(v) => setCosts({ ...costs, commission: v })}
          />
          <InputGroup
            label="Transaction Fee (%)"
            sub="Processing fee per transaction"
            value={costs.fee1}
            onChange={(v) => setCosts({ ...costs, fee1: v })}
          />
          <InputGroup
            label="Service Fee (%)"
            sub="Additional platform support fee"
            value={costs.fee2}
            onChange={(v) => setCosts({ ...costs, fee2: v })}
          />
        </div>
      </div>

      {/* --- ACTIVE MODERATORS --- */}
      <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex justify-between items-center mb-8 px-2">
          <h3 className="text-sm font-black text-[#003366] uppercase tracking-widest">
            Active Moderators
          </h3>
          <button
            onClick={() => showToast("Opening Add Moderator form...")}
            className="bg-[#FF851B] text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-500/20 flex items-center gap-2 hover:-translate-y-1 transition-all"
          >
            <Plus size={16} /> Add Moderator
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">
              <tr>
                <th className="pb-4 px-6">Merchant</th>
                <th className="pb-4 px-6">Email</th>
                <th className="pb-4 px-6">Status</th>
                <th className="pb-4 px-6">Last Active</th>
                <th className="pb-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {moderators.map((mod) => (
                <tr
                  key={mod.id}
                  className="group hover:bg-slate-50/50 transition-colors"
                >
                  <td className="py-5 px-6 text-xs font-black text-[#003366]">
                    {mod.name}
                  </td>
                  <td className="py-5 px-6 text-xs text-gray-400 font-medium">
                    {mod.email}
                  </td>
                  <td className="py-5 px-6">
                    <span className="bg-blue-50 text-blue-500 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
                      Active
                    </span>
                  </td>
                  <td className="py-5 px-6 text-xs text-gray-400 font-bold tracking-tight">
                    {mod.lastActive}
                  </td>
                  <td className="py-5 px-6 text-right">
                    <ActionButtons
                      onVerify={() => handleVerify(mod.id, mod.name, "mod")}
                      onReject={() => handleReject(mod.id, mod.name, "mod")}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// --- REUSABLE SUB-COMPONENTS ---

function StatCard({ title, value, trend, icon, color }) {
  const colorMap = {
    orange: "bg-orange-50 text-orange-500",
    blue: "bg-blue-50 text-[#003366]",
    red: "bg-red-50 text-red-500",
  };
  return (
    <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex items-center justify-between group hover:shadow-xl transition-all duration-300">
      <div>
        <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
          {title}
        </p>
        <h4 className="text-3xl font-black text-[#003366] mt-2 tracking-tighter">
          {value}
        </h4>
        <p
          className={`text-[9px] font-bold mt-1 ${color === "red" ? "text-red-500" : "text-green-500"}`}
        >
          {trend}
        </p>
      </div>
      <div
        className={`p-4 rounded-3xl transition-all group-hover:scale-110 ${colorMap[color]}`}
      >
        {icon}
      </div>
    </div>
  );
}

function DashboardTable({ title, data, renderRow }) {
  return (
    <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex justify-between items-center mb-8 px-2">
        <h3 className="text-sm font-black text-[#003366] uppercase tracking-widest">
          {title}
        </h3>
        <button className="bg-[#FF851B] text-white px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-orange-500/20 transition-transform active:scale-95">
          View All
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <tbody>{data.map(renderRow)}</tbody>
        </table>
      </div>
    </div>
  );
}

function ActionButtons({ onVerify, onReject }) {
  return (
    <div className="flex justify-end gap-2">
      <button
        onClick={onVerify}
        className="p-2.5 bg-green-50 text-green-600 rounded-xl hover:bg-green-500 hover:text-white transition-all shadow-sm group"
        title="Verify"
      >
        <Check size={14} strokeWidth={4} />
      </button>
      <button
        onClick={onReject}
        className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm group"
        title="Reject"
      >
        <X size={14} strokeWidth={4} />
      </button>
    </div>
  );
}

function InputGroup({ label, sub, value, onChange }) {
  return (
    <div className="space-y-3">
      <label className="text-[10px] font-black text-[#003366] uppercase tracking-widest">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-xs font-black text-[#003366] focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all outline-none"
      />
      <p className="text-[9px] font-bold text-gray-400 italic uppercase tracking-tighter">
        {sub}
      </p>
    </div>
  );
}
