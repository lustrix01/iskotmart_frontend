import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Info,
  Package,
  ShoppingBag,
  TrendingUp,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";

const money = (value) =>
  `PHP ${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function MerchantInsights() {
  const [range, setRange] = useState("This Month");
  const [showNet, setShowNet] = useState(false);
  const [insights, setInsights] = useState(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadInsights = async () => {
      try {
        const response = await fetch(
          `/api/merchant_insights.php?range=${encodeURIComponent(range)}`,
          { credentials: "include" },
        );
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload.error || "Unable to load insights.");
        }
        if (isMounted) {
          setInsights(payload);
          setLoadError("");
        }
      } catch (error) {
        if (isMounted) {
          setInsights(null);
          setLoadError(error.message);
        }
      }
    };

    loadInsights();
    return () => {
      isMounted = false;
    };
  }, [range]);

  const summary = insights?.summary || {};
  const trend = useMemo(() => insights?.trend || [], [insights]);
  const performers = insights?.performers || {};
  const breakdown = performers.breakdown || [];
  const topPerformers = performers.top || [];
  const lowPerformers = performers.low || [];
  const deductions = insights?.deductions || {};
  const alerts = insights?.inventoryAlerts || [];
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
        <div>
          <h2 className="text-2xl font-black text-[#003366]">Business Insights</h2>
          <p className="mt-1 text-xs font-bold text-gray-400">
            Revenue, customers, product performance, and inventory health in one view.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
          <Calendar size={16} className="text-[#003366]" />
          <span className="text-[10px] font-bold text-gray-400 uppercase">
            Date:
          </span>
          <select
            value={range}
            onChange={(event) => setRange(event.target.value)}
            className="text-xs font-black text-[#003366] bg-transparent outline-none cursor-pointer"
          >
            <option>This Month</option>
            <option>Last Month</option>
            <option>Last 7 Days</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-5">
        <StatCard title="Gross Revenue" value={money(summary.grossRevenue)} icon={TrendingUp} active />
        <StatCard title="Net Earnings" value={money(summary.netEarnings)} icon={Wallet} />
        <StatCard title="Orders" value={String(summary.orderCount || 0)} icon={ShoppingBag} />
        <StatCard title="Customers" value={String(summary.uniqueCustomerCount || 0)} icon={Users} />
        <StatCard title="Paid Completed" value={String(summary.paidCompletedOrders || 0)} icon={CheckCircle} />
      </div>

      <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
          <div>
            <h3 className="font-bold text-[#003366] text-sm">Revenue Trend</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">
              Paid completed transactions
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
              Show net earnings
            </span>
            <button
              type="button"
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
          <EmptyState text="No paid completed sales in this date range." />
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <PerformanceList title="Top Performers" items={topPerformers} empty="No sales performers yet." />
        <PerformanceList title="Low Performers" items={lowPerformers} empty="No offerings to rank yet." />
      </div>

      <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm">
        <div className="p-4 border-b border-gray-100 flex items-center gap-3 bg-gray-50">
          <Package size={20} className="text-[#003366]" />
          <h3 className="font-black text-[#003366] text-sm tracking-widest uppercase">
            Inventory Alerts
          </h3>
        </div>
        <div className="divide-y divide-gray-100">
          {alerts.length > 0 ? (
            alerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-5">
                <div className="flex items-center gap-4">
                  {alert.type === "warning" ? (
                    <AlertTriangle className="text-yellow-500" size={20} />
                  ) : (
                    <XCircle className="text-red-500" size={20} />
                  )}
                  <span className="text-sm font-bold text-[#003366]">{alert.name}</span>
                </div>
                <span className="text-[11px] italic text-gray-400 font-medium">
                  {alert.status}
                </span>
              </div>
            ))
          ) : (
            <div className="p-10 text-center text-gray-400 text-sm font-medium">
              <CheckCircle className="mx-auto mb-2 text-green-500" size={32} />
              No low-stock product alerts.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, active, icon: Icon }) {
  return (
    <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
          {title}
        </p>
        <h4 className={`text-2xl font-black mt-2 ${active ? "text-[#003366]" : "text-gray-700"}`}>
          {value}
        </h4>
      </div>
      <div className="p-3 rounded-2xl bg-orange-50 text-[#FF851B]">
        {React.createElement(Icon, { size: 24 })}
      </div>
    </div>
  );
}

function PerformanceList({ title, items, empty }) {
  return (
    <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
      <h3 className="text-sm font-bold text-[#003366] uppercase tracking-widest mb-4">
        {title}
      </h3>
      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={`${item.type}-${item.id}`} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
              <span className="text-xs font-bold text-[#003366]">{item.name}</span>
              <span className="text-[10px] text-gray-400">
                {item.quantity} sold - {money(item.revenue)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState text={empty} />
      )}
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
