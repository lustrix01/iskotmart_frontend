import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle,
  Package,
  ShoppingBag,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";

const money = (value) =>
  `PHP ${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function MerchantAnalytics() {
  const [dateFilter, setDateFilter] = useState("This Month");
  const [analytics, setAnalytics] = useState(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadAnalytics = async () => {
      try {
        const response = await fetch(
          `/api/merchant_analytics.php?range=${encodeURIComponent(dateFilter)}`,
          { credentials: "include" },
        );
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload.error || "Unable to load analytics.");
        }
        if (isMounted) {
          setAnalytics(payload);
          setLoadError("");
        }
      } catch (error) {
        if (isMounted) {
          setAnalytics(null);
          setLoadError(error.message);
        }
      }
    };

    loadAnalytics();
    return () => {
      isMounted = false;
    };
  }, [dateFilter]);

  const trend = useMemo(() => analytics?.trend || [], [analytics]);
  const maxTrend = Math.max(...trend.map((bucket) => bucket.sales), 0);
  const chartPoints = useMemo(() => {
    if (trend.length === 0 || maxTrend <= 0) {
      return "";
    }
    return trend
      .map((bucket, index) => {
        const x = trend.length === 1 ? 500 : (index / (trend.length - 1)) * 1000;
        const y = 230 - (Number(bucket.sales || 0) / maxTrend) * 200;
        return `${x},${y}`;
      })
      .join(" ");
  }, [trend, maxTrend]);

  const summary = analytics?.summary || {};
  const topPerformers = analytics?.topPerformers || [];
  const lowPerformers = analytics?.lowPerformers || [];
  const alerts = analytics?.inventoryAlerts || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      {loadError && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-xs font-bold text-red-600">
          {loadError}
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <h2 className="text-2xl font-black text-[#003366]">View Analytics</h2>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
            Date:
          </span>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="text-xs font-black text-[#003366] bg-transparent outline-none cursor-pointer"
          >
            <option>This Month</option>
            <option>Last Month</option>
            <option>Last 7 Days</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Sales" value={money(summary.totalSales)} icon={TrendingUp} />
        <StatCard title="Orders" value={String(summary.orderCount || 0)} icon={ShoppingBag} />
        <StatCard title="Customers" value={String(summary.uniqueCustomerCount || 0)} icon={Users} />
      </div>

      <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h3 className="font-bold text-gray-400 text-sm uppercase tracking-widest">
              Sales Trend
            </h3>
            <p className="text-3xl font-black text-[#003366] mt-2">
              {money(summary.totalSales)}
            </p>
          </div>
        </div>
        {chartPoints ? (
          <div className="relative h-[280px] w-full">
            <svg className="w-full h-full" viewBox="0 0 1000 250" preserveAspectRatio="none">
              <polyline
                points={chartPoints}
                fill="none"
                stroke="#0074D9"
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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

function StatCard({ title, value, icon: Icon }) {
  return (
    <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
          {title}
        </p>
        <h4 className="text-3xl font-black text-[#003366] mt-2">{value}</h4>
      </div>
      <div className="p-3 bg-blue-50 text-[#0074D9] rounded-2xl">
        {React.createElement(Icon, { size: 28 })}
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

function EmptyState({ text }) {
  return <div className="p-8 text-center text-xs font-bold text-gray-400">{text}</div>;
}
