import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  DollarSign,
  ShoppingBag,
  Package,
  Users,
  Clock,
  ArrowRight,
  PlusCircle,
  Settings,
} from "lucide-react";

export default function MerchantDashboard() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("Last 7 Days");

  // --- FR-52: Dynamic Analytics Simulation ---
  const chartData =
    activeFilter === "Last 7 Days"
      ? "M0 180 C 60 140, 100 120, 133 130 C 200 150, 230 180, 266 170 C 330 150, 360 80, 400 70 C 460 50, 500 120, 533 110 C 600 90, 630 30, 666 20 C 720 10, 760 40, 800 50"
      : "M0 150 C 60 160, 100 180, 133 140 C 200 100, 230 60, 266 80 C 330 120, 360 160, 400 140 C 460 90, 500 50, 533 70 C 600 100, 630 130, 666 90 C 720 40, 760 20, 800 30";

  const chartPoints =
    activeFilter === "Last 7 Days"
      ? [
          { cx: 0, cy: 180 },
          { cx: 133, cy: 130 },
          { cx: 266, cy: 170 },
          { cx: 400, cy: 70 },
          { cx: 533, cy: 110 },
          { cx: 666, cy: 20 },
          { cx: 800, cy: 50 },
        ]
      : [
          { cx: 0, cy: 150 },
          { cx: 133, cy: 140 },
          { cx: 266, cy: 80 },
          { cx: 400, cy: 140 },
          { cx: 533, cy: 70 },
          { cx: 666, cy: 90 },
          { cx: 800, cy: 30 },
        ];

  const stats = [
    {
      title: "Total Sales",
      value: activeFilter === "Last 7 Days" ? "₱128,450" : "₱450,200",
      trend: "+12.5% this period",
      icon: DollarSign,
      path: "/merchant/earnings",
      bg: "bg-orange-50",
    },
    {
      title: "Pending Orders",
      value: "1,234",
      trend: "8 new today",
      icon: ShoppingBag,
      path: "/merchant/orders",
      bg: "bg-orange-50",
    },
    {
      title: "Products Listed",
      value: "23",
      trend: "12 active",
      icon: Package,
      path: "/merchant/products",
      bg: "bg-orange-50",
    },
    {
      title: "Store Visitors",
      value: activeFilter === "Last 7 Days" ? "2,847" : "10,492",
      trend: "+18.2% this period",
      icon: Users,
      path: "/merchant/analytics",
      bg: "bg-orange-50",
    },
  ];

  const recentOrders = [
    {
      id: "#ORD-2026-001",
      account: "Juan Dela Cruz",
      product: "iPhone 15 Pro Max",
      amount: "₱65,999.00",
      status: "Delivered",
      date: "Mar 19, 2026",
    },
    {
      id: "#ORD-2026-002",
      account: "Maria Santos",
      product: "MacBook Air M2",
      amount: "₱64,990.00",
      status: "Delivered",
      date: "Mar 19, 2026",
    },
    {
      id: "#ORD-2026-003",
      account: "Ana Lopez",
      product: "AirPods Pro 2",
      amount: "₱13,490.00",
      status: "Pending",
      date: "Mar 18, 2026",
    },
    {
      id: "#ORD-2026-004",
      account: "Pedro Reyes",
      product: "Apple Watch Series 9",
      amount: "₱22,990.00",
      status: "Processing",
      date: "Mar 17, 2026",
    },
  ];

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto space-y-6">
      {/* --- FR-40: QUICK ACTIONS ROW --- */}
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

      {/* 1. TOP STATS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <button
            key={i}
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
            <div
              className={`p-4 rounded-full ${stat.bg} group-hover:bg-[#FF851B] transition-colors`}
            >
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
        {/* 2. FR-52: SALES OVERVIEW CHART */}
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
            <div className="absolute left-6 top-6 bottom-8 flex flex-col justify-between text-[10px] font-bold text-gray-300">
              <span>{activeFilter === "Last 7 Days" ? "30k" : "100k"}</span>
              <span>{activeFilter === "Last 7 Days" ? "24k" : "80k"}</span>
              <span>{activeFilter === "Last 7 Days" ? "18k" : "60k"}</span>
              <span>{activeFilter === "Last 7 Days" ? "12k" : "40k"}</span>
              <span>{activeFilter === "Last 7 Days" ? "6k" : "20k"}</span>
              <span>0</span>
            </div>

            <div className="ml-12 h-64 relative">
              <svg
                className="w-full h-full transition-all duration-500"
                preserveAspectRatio="none"
                viewBox="0 0 800 200"
              >
                <defs>
                  <linearGradient
                    id="chartGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#FF851B" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#FF851B" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                {[0, 40, 80, 120, 160, 200].map((y) => (
                  <path
                    key={y}
                    d={`M0 ${y} L800 ${y}`}
                    stroke="#f3f4f6"
                    strokeWidth="1"
                    fill="none"
                  />
                ))}

                {/* Area Under Curve */}
                <path
                  d={`${chartData} L 800 200 L 0 200 Z`}
                  fill="url(#chartGradient)"
                  className="transition-all duration-500"
                />

                {/* The Line */}
                <path
                  d={chartData}
                  stroke="#FF851B"
                  strokeWidth="3"
                  fill="none"
                  className="transition-all duration-500"
                />

                {/* Data Points */}
                {chartPoints.map((pt, idx) => (
                  <circle
                    key={idx}
                    cx={pt.cx}
                    cy={pt.cy}
                    r="4"
                    fill="#FF851B"
                    stroke="#fff"
                    strokeWidth="2"
                    className="transition-all duration-500"
                  />
                ))}
              </svg>
            </div>

            <div className="ml-12 mt-4 flex justify-between text-[10px] font-bold text-gray-400 px-1">
              {activeFilter === "Last 7 Days" ? (
                <>
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                  <span>Sun</span>
                </>
              ) : (
                <>
                  <span>Wk 1</span>
                  <span>Wk 2</span>
                  <span>Wk 3</span>
                  <span>Wk 4</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 3. RECENT ORDERS (Sidebar format) */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
          <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center bg-white">
            <h3 className="text-base font-bold text-[#003366]">
              Recent Activity
            </h3>
          </div>
          <div className="p-6 space-y-4 overflow-y-auto flex-grow">
            {recentOrders.map((order, i) => (
              <div
                key={i}
                onClick={() => navigate("/merchant/orders")}
                className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50 cursor-pointer transition-colors group"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-gray-400 group-hover:text-[#0074D9] transition-colors">
                    {order.id}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                      order.status === "Pending"
                        ? "bg-orange-100 text-[#FF851B]"
                        : order.status === "Processing"
                          ? "bg-blue-100 text-[#0074D9]"
                          : "bg-green-100 text-green-600"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
                <p className="font-bold text-[#003366] text-sm truncate">
                  {order.product}
                </p>
                <div className="flex justify-between items-end mt-2">
                  <span className="text-xs text-gray-500">{order.account}</span>
                  <span className="font-black text-[#FF851B]">
                    {order.amount}
                  </span>
                </div>
              </div>
            ))}
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
