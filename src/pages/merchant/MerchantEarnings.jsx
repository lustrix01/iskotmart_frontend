import React, { useState } from "react";
import {
  TrendingUp,
  ShoppingBag,
  Calendar,
  ChevronDown,
  Info,
  ArrowUpRight,
  CheckCircle,
} from "lucide-react";

export default function MerchantEarnings() {
  // --- STATE ---
  const [timeframe, setTimeframe] = useState("Daily");
  const [showNet, setShowNet] = useState(false);
  const [dateFilter, setDateFilter] = useState("This Month");
  const [yearFilter, setYearFilter] = useState("2026");
  const [notification, setNotification] = useState(null);

  // --- HANDLERS ---
  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleToggleNet = () => {
    setShowNet(!showNet);
    showToast(
      showNet ? "Switched to Gross Revenue" : "Switched to Net Earnings",
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20 relative">
      {/* --- TOAST NOTIFICATION --- */}
      {notification && (
        <div className="fixed top-20 right-8 z-[100] bg-[#003366] text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right">
          <CheckCircle size={18} className="text-green-400" />
          <span className="text-xs font-bold uppercase tracking-tight">
            {notification}
          </span>
        </div>
      )}

      {/* --- HEADER & FILTERS --- */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <h2 className="text-2xl font-black text-[#003366]">View Earnings</h2>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
            <Calendar size={16} className="text-[#003366]" />
            <span className="text-[10px] font-bold text-gray-400 uppercase">
              Date:
            </span>
            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                showToast(`Date: ${e.target.value}`);
              }}
              className="text-xs font-black text-[#003366] bg-transparent outline-none cursor-pointer"
            >
              <option>This Month</option>
              <option>Last Month</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
            <span className="text-[10px] font-bold text-gray-400 uppercase">
              Year:
            </span>
            <select
              value={yearFilter}
              onChange={(e) => {
                setYearFilter(e.target.value);
                showToast(`Year: ${e.target.value}`);
              }}
              className="text-xs font-black text-[#003366] bg-transparent outline-none cursor-pointer"
            >
              <option>2026</option>
              <option>2025</option>
            </select>
          </div>
        </div>
      </div>

      {/* --- STAT CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Gross Revenue"
          value="₱128,450"
          trend="+12.5% this month"
          active
          icon="orange"
        />
        <StatCard
          title="Net Earnings"
          value="₱92,120"
          trend="+8% new this month"
        />
        <StatCard
          title="Total Orders"
          value="50"
          trend="+5% new this month"
          icon="bag"
        />
      </div>

      {/* --- SALES TREND CHART --- */}
      <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
          <div className="flex items-center gap-4">
            <h3 className="font-bold text-[#003366] text-sm">Sales Trend</h3>
            <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
              <button
                onClick={() => {
                  setTimeframe("Daily");
                  showToast("Viewing Daily Stats");
                }}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${timeframe === "Daily" ? "bg-white text-[#003366] shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
              >
                Daily
              </button>
              <button
                onClick={() => {
                  setTimeframe("Weekly");
                  showToast("Viewing Weekly Stats");
                }}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${timeframe === "Weekly" ? "bg-white text-[#003366] shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
              >
                Weekly
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
              Switch to Net Earnings
            </span>
            <button
              onClick={handleToggleNet}
              className={`w-12 h-6 rounded-full p-1 transition-colors relative ${showNet ? "bg-[#FF851B]" : "bg-gray-200"}`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full transition-transform ${showNet ? "translate-x-6" : "translate-x-0"}`}
              />
            </button>
          </div>
        </div>

        <div className="mb-10">
          <p className="text-3xl font-black text-[#003366]">₱128,450</p>
          <p className="text-[10px] text-[#0074D9] font-bold uppercase tracking-widest mt-1">
            {showNet ? "Net Earnings" : "Gross Revenue"}
          </p>
        </div>

        {/* Custom SVG Chart */}
        <div className="relative h-[250px] w-full">
          <svg
            className="w-full h-full overflow-visible"
            viewBox="0 0 1000 250"
            preserveAspectRatio="none"
          >
            {/* Grid Lines */}
            {[0, 50, 100, 150, 200, 250].map((y) => (
              <line
                key={y}
                x1="0"
                y1={y}
                x2="1000"
                y2={y}
                stroke="#F1F5F9"
                strokeWidth="1"
              />
            ))}

            {/* Smooth Curve Line */}
            <path
              d="M0,200 Q150,210 250,200 T500,150 T750,160 T1000,180"
              fill="none"
              stroke={showNet ? "#003366" : "#FF851B"}
              strokeWidth="5"
              strokeLinecap="round"
              className="transition-all duration-500"
            />

            {/* Tooltip Point */}
            <circle
              cx="750"
              cy="160"
              r="6"
              fill={showNet ? "#003366" : "#FF851B"}
              stroke="white"
              strokeWidth="3"
            />
            <foreignObject x="700" y="110" width="100" height="40">
              <div className="bg-white px-2 py-1 rounded-lg shadow-xl border border-gray-100 flex flex-col items-center">
                <span className="text-[8px] font-black text-gray-300">
                  Jun 30
                </span>
                <span className="text-[10px] font-black text-[#003366]">
                  ₱12,345
                </span>
              </div>
            </foreignObject>
          </svg>
          <div className="flex justify-between mt-6 px-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            {[
              "Sep",
              "Oct",
              "Nov",
              "Dec",
              "Jan",
              "Feb",
              "Mar",
              "Apr",
              "may",
              "Jun",
              "Jul",
              "Aug",
            ].map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
        </div>
      </div>

      {/* --- BOTTOM ROW --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Breakdown */}
        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
          <h3 className="font-bold text-[#003366] mb-8 text-sm">
            Revenue Breakdown
          </h3>
          <div className="space-y-4">
            <BreakdownRow
              name="Mechanical Keyboard"
              sold="123"
              percent="65"
              color="bg-gray-200"
            />
            <BreakdownRow
              name="USB-C Adapter"
              sold="11"
              percent="15"
              color="bg-gray-300"
            />
            <BreakdownRow
              name="Gaming Mousepad"
              sold="23"
              percent="20"
              color="bg-gray-400"
            />
          </div>
        </div>

        {/* Deduction & Fees Pie Chart */}
        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm relative">
          <h3 className="font-bold text-[#003366] mb-4 text-sm">
            Deduction & Fees
          </h3>
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Simple CSS Pie Chart */}
            <div
              className="relative w-48 h-48 rounded-full shadow-inner"
              style={{
                background: `conic-gradient(#E2E8F0 0% 65%, #64748B 65% 85%, #EF4444 85% 95%, #06B6D4 95% 100%)`,
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 bg-white rounded-full shadow-md flex items-center justify-center">
                  <p className="text-center">
                    <span className="block text-2xl font-black text-[#003366]">
                      ₱36k
                    </span>
                    <span className="text-[8px] font-bold text-gray-400 uppercase">
                      Total Fees
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-3">
              <LegendItem color="bg-[#E2E8F0]" label="Fees" />
              <LegendItem color="bg-[#64748B]" label="Discounts" />
              <LegendItem color="bg-[#EF4444]" label="Refunds" />
              <LegendItem color="bg-[#06B6D4]" label="Vouchers" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function StatCard({ title, value, trend, active, icon }) {
  return (
    <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md transition-all group">
      <div>
        <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
          {title}
        </p>
        <h4
          className={`text-3xl font-black mt-2 transition-colors ${active ? "text-[#003366]" : "text-gray-700 group-hover:text-[#003366]"}`}
        >
          {value}
        </h4>
        <p className="text-[10px] font-bold text-green-500 mt-1">{trend}</p>
      </div>
      <div
        className={`p-4 rounded-2xl transition-all ${icon === "orange" ? "bg-orange-50 text-[#FF851B]" : "bg-gray-50 text-gray-400 group-hover:bg-blue-50 group-hover:text-[#0074D9]"}`}
      >
        {icon === "bag" ? <ShoppingBag size={28} /> : <TrendingUp size={28} />}
      </div>
    </div>
  );
}

function BreakdownRow({ name, sold, percent, color }) {
  return (
    <div className="relative h-14 bg-white border border-gray-100 rounded-2xl overflow-hidden group">
      <div
        className={`absolute inset-y-0 left-0 transition-all duration-1000 ${color} opacity-20`}
        style={{ width: `${percent}%` }}
      />
      <div className="relative h-full px-6 flex items-center justify-between">
        <span className="text-xs font-bold text-[#003366]">{name}</span>
        <div className="flex items-center gap-10">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
            Sold: {sold}
          </span>
          <span className="text-xs font-black text-gray-700">{percent}%</span>
        </div>
      </div>
    </div>
  );
}

function LegendItem({ color, label }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-4 h-1.5 rounded-full ${color}`} />
      <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}
