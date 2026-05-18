import React, { useEffect, useMemo, useState } from "react";
import { Calendar, Info, ShoppingBag, TrendingUp } from "lucide-react";

const money = (value) =>
  `PHP ${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function MerchantEarnings() {
  const [showNet, setShowNet] = useState(false);
  const [dateFilter, setDateFilter] = useState("This Month");
  const [earnings, setEarnings] = useState(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadEarnings = async () => {
      try {
        const response = await fetch("/api/merchant_earnings.php", {
          credentials: "include",
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload.error || "Unable to load earnings.");
        }
        if (isMounted) {
          setEarnings(payload);
          setLoadError("");
        }
      } catch (error) {
        if (isMounted) {
          setEarnings(null);
          setLoadError(error.message);
        }
      }
    };

    loadEarnings();
    return () => {
      isMounted = false;
    };
  }, [dateFilter]);

  const summary = earnings?.summary || {};
  const trend = useMemo(() => earnings?.trend || [], [earnings]);
  const breakdown = earnings?.breakdown || [];
  const deductions = earnings?.deductions || {};
  const activeTotal = showNet ? summary.netEarnings : summary.grossRevenue;
  const maxTrend = Math.max(
    ...trend.map((bucket) => (showNet ? bucket.net : bucket.gross)),
    0,
  );
  const chartPoints = useMemo(() => {
    if (trend.length === 0 || maxTrend <= 0) {
      return "";
    }
    return trend
      .map((bucket, index) => {
        const value = showNet ? bucket.net : bucket.gross;
        const x = trend.length === 1 ? 500 : (index / (trend.length - 1)) * 1000;
        const y = 230 - (Number(value || 0) / maxTrend) * 200;
        return `${x},${y}`;
      })
      .join(" ");
  }, [trend, maxTrend, showNet]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      {loadError && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-xs font-bold text-red-600">
          {loadError}
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <h2 className="text-2xl font-black text-[#003366]">View Earnings</h2>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
          <Calendar size={16} className="text-[#003366]" />
          <span className="text-[10px] font-bold text-gray-400 uppercase">
            Date:
          </span>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="text-xs font-black text-[#003366] bg-transparent outline-none cursor-pointer"
          >
            <option>This Month</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Gross Revenue" value={money(summary.grossRevenue)} icon={TrendingUp} active />
        <StatCard title="Net Earnings" value={money(summary.netEarnings)} icon={TrendingUp} />
        <StatCard title="Paid Completed Orders" value={String(summary.paidCompletedOrders || 0)} icon={ShoppingBag} />
      </div>

      <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
          <h3 className="font-bold text-[#003366] text-sm">Revenue Trend</h3>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
              Show net earnings
            </span>
            <button
              onClick={() => setShowNet((current) => !current)}
              className={`w-12 h-6 rounded-full p-1 transition-colors ${showNet ? "bg-[#FF851B]" : "bg-gray-200"}`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full transition-transform ${showNet ? "translate-x-6" : "translate-x-0"}`}
              />
            </button>
          </div>
        </div>

        <div className="mb-10">
          <p className="text-3xl font-black text-[#003366]">{money(activeTotal)}</p>
          <p className="text-[10px] text-[#0074D9] font-bold uppercase tracking-widest mt-1">
            {showNet ? "Net Earnings" : "Gross Revenue"}
          </p>
        </div>

        {chartPoints ? (
          <div className="relative h-[280px] w-full">
            <svg className="w-full h-full" viewBox="0 0 1000 250" preserveAspectRatio="none">
              <polyline
                points={chartPoints}
                fill="none"
                stroke={showNet ? "#003366" : "#FF851B"}
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="flex justify-between mt-3 text-[10px] font-bold text-gray-400 uppercase">
              {trend.map((bucket) => (
                <span key={bucket.label}>{bucket.label}</span>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState text="No paid completed earnings yet." />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
          <h3 className="font-bold text-[#003366] mb-8 text-sm">
            Revenue Breakdown
          </h3>
          {breakdown.length > 0 ? (
            <div className="space-y-4">
              {breakdown.map((item) => (
                <div key={`${item.type}-${item.id}`} className="relative min-h-16 bg-white border border-gray-100 rounded-2xl overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-[#0074D9] opacity-10"
                    style={{ width: `${Math.min(100, item.percent || 0)}%` }}
                  />
                  <div className="relative h-full px-6 py-4 flex items-center justify-between gap-4">
                    <div>
                      <span className="block text-xs font-bold text-[#003366]">{item.name}</span>
                      <span className="text-[10px] text-gray-400">{item.type} - {item.quantity} sold</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-xs font-black text-gray-700">{money(item.gross)}</span>
                      <span className="text-[10px] text-gray-400">{item.percent}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState text="No offering revenue to show yet." />
          )}
        </div>

        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
          <h3 className="font-bold text-[#003366] mb-4 text-sm">
            Deductions & Fees
          </h3>
          <div className="space-y-3">
            <DeductionRow label="Discounts" value={deductions.discounts} />
            <DeductionRow label="Vouchers" value={deductions.vouchers} />
            <DeductionRow label="Refunds" value={deductions.refunds} />
            <DeductionRow label="Platform fees" value={deductions.platformFees} />
          </div>
          {deductions.note && (
            <div className="mt-6 flex items-start gap-3 rounded-2xl bg-blue-50 p-4 text-xs font-bold text-[#003366]">
              <Info size={16} className="mt-0.5 shrink-0" />
              {deductions.note}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, active, icon: Icon }) {
  return (
    <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
          {title}
        </p>
        <h4 className={`text-3xl font-black mt-2 ${active ? "text-[#003366]" : "text-gray-700"}`}>
          {value}
        </h4>
      </div>
      <div className="p-4 rounded-2xl bg-orange-50 text-[#FF851B]">
        {React.createElement(Icon, { size: 28 })}
      </div>
    </div>
  );
}

function DeductionRow({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-50 py-3 last:border-0">
      <span className="text-xs font-bold text-gray-500">{label}</span>
      <span className="text-xs font-black text-[#003366]">{money(value)}</span>
    </div>
  );
}

function EmptyState({ text }) {
  return <div className="p-8 text-center text-xs font-bold text-gray-400">{text}</div>;
}
