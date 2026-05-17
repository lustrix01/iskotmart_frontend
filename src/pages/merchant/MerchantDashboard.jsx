import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DollarSign,
  ShoppingBag,
  Package,
  Users,
  PlusCircle,
  Settings,
} from "lucide-react";

const formatMoney = (value) =>
  `PHP ${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const chartKeyForFilter = (filter) =>
  filter === "Last 30 Days" ? "last30Days" : "last7Days";

const compactMoney = (value) => {
  const amount = Number(value || 0);
  if (amount >= 1000000) {
    return `PHP ${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `PHP ${(amount / 1000).toFixed(1)}K`;
  }
  return `PHP ${amount.toFixed(0)}`;
};

export default function MerchantDashboard() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("Last 7 Days");
  const [summary, setSummary] = useState(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadSummary = async () => {
      try {
        const response = await fetch("/api/merchant_dashboard.php", {
          credentials: "include",
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload.error || "Unable to load dashboard data.");
        }
        if (isMounted) {
          setSummary(payload);
          setLoadError("");
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(error.message);
        }
      }
    };

    loadSummary();

    return () => {
      isMounted = false;
    };
  }, []);

  const stats = useMemo(
    () => [
      {
        title: "Total Sales",
        value: summary?.stats?.totalSalesFormatted || formatMoney(0),
        trend: `${summary?.stats?.totalOrders || 0} paid completed orders`,
        icon: DollarSign,
        path: "/merchant/earnings",
      },
      {
        title: "Active Orders",
        value: String(summary?.stats?.activeOrders ?? summary?.stats?.pendingOrders ?? 0),
        trend: "Not completed or cancelled",
        icon: ShoppingBag,
        path: "/merchant/orders",
      },
      {
        title: "Products Listed",
        value: String(summary?.stats?.catalogItems || 0),
        trend: `${summary?.stats?.activeCatalogItems || 0} active`,
        icon: Package,
        path: "/merchant/products",
      },
      {
        title: "Store Visitors",
        value: String(summary?.stats?.storeVisitors || 0),
        trend: "No visitor table in schema",
        icon: Users,
        path: "/merchant/analytics",
      },
    ],
    [summary],
  );

  const recentOrders = summary?.recentOrders || [];
  const trendData = Array.isArray(summary?.salesTrend?.[chartKeyForFilter(activeFilter)])
    ? summary.salesTrend[chartKeyForFilter(activeFilter)]
    : [];
  const maxSales = Math.max(...trendData.map((point) => Number(point.sales || 0)), 0);
  const chartWidth = 800;
  const chartHeight = 220;
  const chartPadding = 18;
  const usableHeight = chartHeight - chartPadding * 2;
  const xStep = trendData.length > 1 ? chartWidth / (trendData.length - 1) : chartWidth;
  const chartPoints = trendData.map((point, index) => {
    const sales = Number(point.sales || 0);
    const x = index * xStep;
    const y = maxSales > 0
      ? chartPadding + usableHeight - (sales / maxSales) * usableHeight
      : chartPadding + usableHeight;
    return { ...point, x, y, sales };
  });
  const linePath = chartPoints
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(" ");
  const areaPath = chartPoints.length > 0
    ? `${linePath} L ${chartPoints[chartPoints.length - 1].x.toFixed(2)} ${chartHeight - chartPadding} L 0 ${chartHeight - chartPadding} Z`
    : "";
  const totalChartSales = trendData.reduce((sum, point) => sum + Number(point.sales || 0), 0);
  const totalChartOrders = trendData.reduce((sum, point) => sum + Number(point.orders || 0), 0);
  const labelInterval = activeFilter === "Last 30 Days" ? 5 : 1;

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto space-y-6">
      {loadError && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-xs font-bold text-red-600">
          {loadError}
        </div>
      )}

      <div className="flex gap-4">
        <button
          onClick={() => navigate("/merchant/products")}
          className="flex-1 bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-center gap-3 hover:border-[#FF851B] hover:shadow-md transition-all text-[#003366] font-bold"
        >
          <div className="w-8 h-8 rounded-full bg-orange-50 text-[#FF851B] flex items-center justify-center">
            <PlusCircle size={18} />
          </div>
          Quick Add Catalog Item
        </button>
        <button
          onClick={() => navigate("/merchant/settings")}
          className="flex-1 bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-center gap-3 hover:border-[#0074D9] hover:shadow-md transition-all text-[#003366] font-bold"
        >
          <div className="w-8 h-8 rounded-full bg-blue-50 text-[#0074D9] flex items-center justify-center">
            <Settings size={18} />
          </div>
          Configure Store Settings
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <button
            key={stat.title}
            onClick={() => navigate(stat.path)}
            className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between transition-all hover:shadow-lg hover:border-[#FF851B]/30 hover:-translate-y-1 text-left group"
          >
            <div>
              <h3 className="text-gray-500 text-[10px] font-bold mb-1 uppercase tracking-widest">
                {stat.title}
              </h3>
              <p className="text-3xl font-extrabold text-[#003366] mb-1 transition-all">
                {stat.value}
              </p>
              <p className="text-[10px] font-bold text-green-500">
                {stat.trend}
              </p>
            </div>
            <div className="p-4 rounded-full bg-orange-50 group-hover:bg-[#FF851B] transition-colors">
              <stat.icon
                size={28}
                className="text-[#FF851B] group-hover:text-white transition-colors"
                strokeWidth={2.5}
              />
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden lg:col-span-2">
          <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center bg-white">
            <h3 className="text-base font-bold text-[#003366]">
              Sales Reports & Analytics
            </h3>
            <div className="flex gap-2">
              {["Last 7 Days", "Last 30 Days"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`text-[11px] font-bold px-4 py-2 rounded-md transition-all ${
                    activeFilter === filter
                      ? "bg-[#0074D9] text-white shadow-md shadow-blue-100"
                      : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
          <div className="p-6 relative">
            <div className="mb-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl bg-orange-50 border border-orange-100 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-orange-400">Revenue</p>
                <p className="text-lg font-black text-[#FF851B]">{formatMoney(totalChartSales)}</p>
              </div>
              <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Paid orders</p>
                <p className="text-lg font-black text-[#003366]">{totalChartOrders}</p>
              </div>
              <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Peak day</p>
                <p className="text-lg font-black text-[#003366]">
                  {maxSales > 0
                    ? chartPoints.reduce((peak, point) => point.sales > peak.sales ? point : peak, chartPoints[0]).label
                    : "No sales"}
                </p>
              </div>
            </div>

            <div className="h-72 relative">
              <div className="absolute left-0 top-0 bottom-8 w-20 flex flex-col justify-between text-[10px] font-bold text-gray-400">
                {[1, 0.75, 0.5, 0.25, 0].map((ratio) => (
                  <span key={ratio}>{compactMoney(maxSales * ratio)}</span>
                ))}
              </div>
              <div className="ml-20 h-64 relative">
                {trendData.length === 0 || maxSales === 0 ? (
                  <div className="h-full border border-dashed border-gray-200 rounded-xl flex items-center justify-center text-xs font-bold text-gray-400">
                    No paid completed sales in this period.
                  </div>
                ) : (
                  <svg
                    className="w-full h-full transition-all duration-500"
                    preserveAspectRatio="none"
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  >
                    {[0.25, 0.5, 0.75, 1].map((ratio) => (
                      <line
                        key={ratio}
                        x1="0"
                        x2={chartWidth}
                        y1={chartPadding + usableHeight * (1 - ratio)}
                        y2={chartPadding + usableHeight * (1 - ratio)}
                        stroke="#E5E7EB"
                        strokeWidth="1"
                        vectorEffect="non-scaling-stroke"
                      />
                    ))}
                    <path d={areaPath} fill="#FF851B" opacity="0.12" />
                    <path
                      d={linePath}
                      stroke="#FF851B"
                      strokeWidth="3"
                      fill="none"
                      vectorEffect="non-scaling-stroke"
                    />
                    {chartPoints.map((point) => (
                      <circle
                        key={point.date}
                        cx={point.x}
                        cy={point.y}
                        r="4"
                        fill="#FFFFFF"
                        stroke="#FF851B"
                        strokeWidth="2"
                        vectorEffect="non-scaling-stroke"
                      >
                        <title>{`${point.label}: ${formatMoney(point.sales)} from ${point.orders} order${point.orders === 1 ? "" : "s"}`}</title>
                      </circle>
                    ))}
                  </svg>
                )}
              </div>
            </div>
            <div className="ml-20 mt-2 grid text-[10px] font-bold text-gray-400" style={{ gridTemplateColumns: `repeat(${Math.max(trendData.length, 1)}, minmax(0, 1fr))` }}>
              {trendData.map((point, index) => (
                <span
                  key={point.date}
                  className={`${index % labelInterval === 0 || index === trendData.length - 1 ? "opacity-100" : "opacity-0"} ${index === trendData.length - 1 ? "text-right" : ""}`}
                >
                  {point.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
          <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center bg-white">
            <h3 className="text-base font-bold text-[#003366]">
              Recent Activity
            </h3>
          </div>
          <div className="p-6 space-y-4 overflow-y-auto flex-grow">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => navigate("/merchant/orders")}
                className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50 cursor-pointer transition-colors group"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-gray-400 group-hover:text-[#0074D9] transition-colors">
                    {order.id}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-orange-100 text-[#FF851B]">
                    {order.status}
                  </span>
                </div>
                <p className="font-bold text-[#003366] text-sm truncate">
                  {order.product}
                </p>
                <div className="flex justify-between items-end mt-2">
                  <span className="text-xs text-gray-500">
                    {order.account}
                  </span>
                  <span className="font-black text-[#FF851B]">
                    {order.amount}
                  </span>
                </div>
              </div>
            ))}
            {recentOrders.length === 0 && (
              <div className="border border-dashed border-gray-200 rounded-xl p-8 text-center text-xs font-bold text-gray-400">
                No active orders right now.
              </div>
            )}
          </div>
          <div className="p-4 border-t border-gray-50 bg-gray-50/50">
            <button
              onClick={() => navigate("/merchant/orders")}
              className="w-full text-center text-xs font-bold text-[#0074D9] hover:underline"
            >
              View All Orders
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
