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
        trend: `${summary?.stats?.totalOrders || 0} database orders`,
        icon: DollarSign,
        path: "/merchant/earnings",
      },
      {
        title: "Pending Orders",
        value: String(summary?.stats?.pendingOrders || 0),
        trend: "Awaiting merchant action",
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
  const chartData =
    activeFilter === "Last 7 Days"
      ? "M0 180 C 60 140, 100 120, 133 130 C 200 150, 230 180, 266 170 C 330 150, 360 80, 400 70 C 460 50, 500 120, 533 110 C 600 90, 630 30, 666 20 C 720 10, 760 40, 800 50"
      : "M0 150 C 60 160, 100 180, 133 140 C 200 100, 230 60, 266 80 C 330 120, 360 160, 400 140 C 460 90, 500 50, 533 70 C 600 100, 630 130, 666 90 C 720 40, 760 20, 800 30";

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
            <div className="ml-12 h-64 relative">
              <svg
                className="w-full h-full transition-all duration-500"
                preserveAspectRatio="none"
                viewBox="0 0 800 200"
              >
                <path
                  d={chartData}
                  stroke="#FF851B"
                  strokeWidth="3"
                  fill="none"
                  className="transition-all duration-500"
                />
              </svg>
            </div>
            <div className="ml-12 mt-4 flex justify-between text-[10px] font-bold text-gray-400 px-1">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                <span key={day}>{day}</span>
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
                No database orders for this merchant yet.
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
