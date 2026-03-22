import React, { useState } from "react";
import {
  TrendingUp,
  ShoppingBag,
  Users,
  AlertTriangle,
  XCircle,
  Package,
  Calendar,
  CheckCircle,
  Plus,
} from "lucide-react";

export default function MerchantAnalytics() {
  // --- STATE ---
  const [dateFilter, setDateFilter] = useState("This Month");
  const [compareFilter, setCompareFilter] = useState("Last Month");
  const [yearFilter, setYearFilter] = useState("2026");
  const [notification, setNotification] = useState(null);

  // Inventory State
  const [alerts, setAlerts] = useState([
    {
      id: 1,
      name: "Mechanical Keyboard",
      status: "Low Stocks - 5 remaining",
      type: "warning",
    },
    {
      id: 2,
      name: "USB-C Hub Adapter",
      status: "Out of Stock - Restock Needed",
      type: "error",
    },
    {
      id: 3,
      name: "Gaming Mousepad",
      status: "Low Stocks - 2 remaining",
      type: "warning",
    },
  ]);

  // --- HANDLERS ---
  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleRestock = (id, name) => {
    // Simulate restock by removing the alert
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
    showToast(`Restock request sent for ${name}!`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20 relative">
      {/* --- TOAST NOTIFICATION --- */}
      {notification && (
        <div className="fixed top-20 right-8 z-[100] bg-[#003366] text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right">
          <CheckCircle size={18} className="text-green-400" />
          <span className="text-xs font-bold">{notification}</span>
        </div>
      )}

      {/* --- TOP HEADER & FILTERS --- */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <h2 className="text-2xl font-black text-[#003366]">View Analytics</h2>

        <div className="flex flex-wrap items-center gap-4">
          <FilterSelect
            label="Date"
            value={dateFilter}
            options={["This Month", "Last Month", "Last 7 Days"]}
            onChange={(v) => {
              setDateFilter(v);
              showToast(`Date filter: ${v}`);
            }}
          />
          <FilterSelect
            label="Compare"
            value={compareFilter}
            options={["Last Month", "Last Year"]}
            onChange={(v) => {
              setCompareFilter(v);
              showToast(`Comparing to: ${v}`);
            }}
          />
          <FilterSelect
            label="Year"
            value={yearFilter}
            options={["2026", "2025", "2024"]}
            onChange={(v) => {
              setYearFilter(v);
              showToast(`Year set to ${v}`);
            }}
          />
        </div>
      </div>

      {/* --- STAT CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Sales"
          value="₱128,450"
          trend="+12.5% this month"
        />
        <StatCard title="Orders" value="350" trend="+8% new this month" />
        <StatCard title="Customers" value="50" trend="+5% new this month" />
      </div>

      {/* --- SALES TREND CHART --- */}
      <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h3 className="font-bold text-gray-400 text-sm uppercase tracking-widest">
              Sales Trend
            </h3>
            <p className="text-3xl font-black text-[#003366] mt-2">₱128,450</p>
            <p className="text-[10px] text-[#0074D9] font-bold uppercase tracking-tighter mt-1">
              Total Sales
            </p>
          </div>
          <div className="flex items-center gap-6">
            <Legend color="#FF851B" label="Last Month" />
            <Legend color="#0074D9" label="This Month" />
          </div>
        </div>

        <div className="relative h-[250px] w-full mt-10">
          <svg
            className="w-full h-full overflow-visible"
            viewBox="0 0 1000 250"
            preserveAspectRatio="none"
          >
            <path
              d="M0,180 Q100,200 200,160 T400,140 T600,170 T800,150 T1000,160"
              fill="none"
              stroke="#FF851B"
              strokeWidth="3"
              strokeDasharray="6"
              opacity="0.4"
            />
            <path
              d="M0,140 Q100,130 200,160 T400,150 T600,100 T800,130 T1000,110 L1000,250 L0,250 Z"
              fill="url(#blueGradient)"
              opacity="0.1"
            />
            <path
              d="M0,140 Q100,130 200,160 T400,150 T600,100 T800,130 T1000,110"
              fill="none"
              stroke="#0074D9"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <circle
              cx="620"
              cy="100"
              r="6"
              fill="#0074D9"
              stroke="white"
              strokeWidth="3"
            />
            <defs>
              <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0074D9" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
            </defs>
          </svg>
          <div className="flex justify-between mt-6 px-2 text-[10px] font-bold text-gray-400 uppercase">
            {[
              "Sep",
              "Oct",
              "Nov",
              "Dec",
              "Jan",
              "Feb",
              "Mar",
              "Apr",
              "May",
              "Jun",
              "Jul",
              "Aug",
            ].map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
        </div>
      </div>

      {/* --- BOTTOM SECTION --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <PerformanceItem
            title="Top Performing Products"
            items={["Mechanical Keyboard", "USB-C Hub", "Mousepad"]}
            color="text-green-500"
          />
          <PerformanceItem
            title="Low Performing Products"
            items={["Generic Charger", "Cable Ties"]}
            color="text-red-500"
          />
        </div>

        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex flex-col items-center">
          <h3 className="w-full font-bold text-[#003366] mb-8">
            Customer Activity
          </h3>
          <div
            className="relative w-48 h-48 rounded-full border-[20px] border-[#0074D9] flex items-center justify-center"
            style={{
              background: `conic-gradient(#FF851B 0% 35%, transparent 35% 100%)`,
            }}
          >
            <div className="text-center">
              <span className="block text-2xl font-black text-[#003366]">
                50
              </span>
              <span className="text-[10px] font-bold text-gray-400">Total</span>
            </div>
          </div>
          <div className="flex gap-6 mt-8">
            <Legend color="#FF851B" label="New (35%)" />
            <Legend color="#0074D9" label="Returning (65%)" />
          </div>
        </div>
      </div>

      {/* --- INVENTORY ALERTS --- */}
      <div className="bg-[#EAEAEA] rounded-3xl overflow-hidden border border-gray-200 shadow-sm animate-in slide-in-from-bottom">
        <div className="p-4 border-b border-gray-300 flex items-center gap-3 bg-gray-100">
          <Package size={20} className="text-[#003366]" />
          <h3 className="font-black text-[#003366] text-sm tracking-widest uppercase">
            Inventory Alerts
          </h3>
        </div>
        <div className="divide-y divide-gray-200 bg-white">
          {alerts.length > 0 ? (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex flex-col md:flex-row md:items-center justify-between p-5 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {alert.type === "warning" ? (
                    <AlertTriangle className="text-yellow-500" size={20} />
                  ) : (
                    <XCircle className="text-red-500" size={20} />
                  )}
                  <span className="text-sm font-bold text-[#003366]">
                    {alert.name}
                  </span>
                </div>
                <div className="flex items-center gap-6 mt-3 md:mt-0">
                  <span className="text-[11px] italic text-gray-400 font-medium">
                    ({alert.status})
                  </span>
                  <button
                    onClick={() => handleRestock(alert.id, alert.name)}
                    className="bg-black text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all active:scale-95"
                  >
                    Restock
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-10 text-center text-gray-400 text-sm font-medium">
              <CheckCircle className="mx-auto mb-2 text-green-500" size={32} />
              All stocks are healthy!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function FilterSelect({ label, value, options, onChange }) {
  return (
    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
        {label}:
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-xs font-black text-[#003366] bg-transparent outline-none cursor-pointer"
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

function StatCard({ title, value, trend }) {
  return (
    <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex items-center justify-between group cursor-default">
      <div>
        <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
          {title}
        </p>
        <h4 className="text-3xl font-black text-[#003366] mt-2 group-hover:text-[#FF851B] transition-colors">
          {value}
        </h4>
        <p className="text-[10px] font-bold text-green-500 mt-1">{trend}</p>
      </div>
      <div className="p-3 bg-gray-50 text-gray-400 rounded-2xl group-hover:bg-blue-50 group-hover:text-[#0074D9] transition-all">
        <TrendingUp size={28} />
      </div>
    </div>
  );
}

function PerformanceItem({ title, items, color }) {
  return (
    <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
      <h3
        className={`text-sm font-bold ${color} uppercase tracking-widest mb-4`}
      >
        {title}
      </h3>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div
            key={i}
            className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0"
          >
            <span className="text-xs font-bold text-[#003366]">{item}</span>
            <span className="text-[10px] text-gray-400">View Details</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-2.5 h-2.5 rounded-full"
        style={{ backgroundColor: color }}
      ></div>
      <span className="text-[10px] font-bold text-gray-400">{label}</span>
    </div>
  );
}
