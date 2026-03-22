import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  DollarSign,
  ShoppingBag,
  Package,
  Users,
  Clock,
  ArrowRight,
} from "lucide-react";

export default function MerchantDashboard() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("Last 7 Days");

  // Simulation Modal State
  const [modal, setModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    action: "",
  });

  const triggerSimulation = (title, message, action) => {
    setModal({ isOpen: true, title, message, action });
  };

  const closeModal = () => setModal({ ...modal, isOpen: false });

  const stats = [
    {
      title: "Total Sales",
      value: "₱128,450",
      trend: "+12.5% this month",
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
      value: "2,847",
      trend: "+18.2% this week",
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
              <p className="text-3xl font-extrabold text-[#003366] mb-1">
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

      {/* 2. RECENT ORDERS TABLE (Renamed from Recent Changes) */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center bg-white">
          <h3 className="text-base font-bold text-[#003366]">Recent Orders</h3>
          <Link
            to="/merchant/orders"
            className="bg-[#FF851B] text-white text-[11px] font-bold px-4 py-2 rounded-md hover:bg-[#e67616] transition-all shadow-sm active:scale-95"
          >
            View All
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[#F8FAFC] border-y border-gray-100 text-[11px] font-bold text-[#003366] capitalize tracking-widest">
                <th className="p-4 pl-6">Order ID</th>
                <th className="p-4">Account</th>
                <th className="p-4">Product</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Type</th>
                <th className="p-4 pr-6">Details</th>
              </tr>
            </thead>
            <tbody className="text-xs font-medium text-gray-600">
              {recentOrders.map((order, i) => (
                <tr
                  key={i}
                  className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer group"
                  onClick={() =>
                    triggerSimulation(
                      "Order Details",
                      `Fetching data for ${order.id}`,
                      `GET /api/v1/merchant/orders/${order.id}`,
                    )
                  }
                >
                  <td className="p-4 pl-6 text-gray-400 font-mono text-[11px] group-hover:text-[#0074D9] transition-colors">
                    {order.id}
                  </td>
                  <td className="p-4 text-gray-800 font-semibold">
                    {order.account}
                  </td>
                  <td className="p-4 text-gray-500">{order.product}</td>
                  <td className="p-4 font-bold text-[#003366]">
                    {order.amount}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                        order.status === "Pending"
                          ? "bg-orange-100 text-[#FF851B]"
                          : order.status === "Processing"
                            ? "bg-blue-100 text-[#0074D9]"
                            : "bg-green-100 text-green-600"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="p-4 pr-6 text-gray-400">{order.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. SALES OVERVIEW CHART (RESTORED BEAUTIFUL VERSION) */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center bg-white">
          <h3 className="text-base font-bold text-[#003366]">
            Sales Overview (Last 7 Days)
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
          {/* Y-Axis Labels */}
          <div className="absolute left-6 top-6 bottom-8 flex flex-col justify-between text-[10px] font-bold text-gray-300">
            <span>30,000</span>
            <span>26,000</span>
            <span>22,000</span>
            <span>18,000</span>
            <span>14,000</span>
            <span>10,000</span>
          </div>

          <div className="ml-12 h-64 relative">
            <svg
              className="w-full h-full"
              preserveAspectRatio="none"
              viewBox="0 0 800 200"
            >
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF851B" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#FF851B" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid Lines */}
              <path
                d="M0 0 L800 0"
                stroke="#f3f4f6"
                strokeWidth="1"
                fill="none"
              />
              <path
                d="M0 40 L800 40"
                stroke="#f3f4f6"
                strokeWidth="1"
                fill="none"
              />
              <path
                d="M0 80 L800 80"
                stroke="#f3f4f6"
                strokeWidth="1"
                fill="none"
              />
              <path
                d="M0 120 L800 120"
                stroke="#f3f4f6"
                strokeWidth="1"
                fill="none"
              />
              <path
                d="M0 160 L800 160"
                stroke="#f3f4f6"
                strokeWidth="1"
                fill="none"
              />
              <path
                d="M0 200 L800 200"
                stroke="#f3f4f6"
                strokeWidth="1"
                fill="none"
              />

              {/* Area Under Curve - Fixed coordinates for beauty */}
              <path
                d="M0 180 C 60 140, 100 120, 133 130 C 200 150, 230 180, 266 170 C 330 150, 360 80, 400 70 C 460 50, 500 120, 533 110 C 600 90, 630 30, 666 20 C 720 10, 760 40, 800 50 L 800 200 L 0 200 Z"
                fill="url(#chartGradient)"
              />

              {/* The Line with IskoMart Orange - Fixed path */}
              <path
                d="M0 180 C 60 140, 100 120, 133 130 C 200 150, 230 180, 266 170 C 330 150, 360 80, 400 70 C 460 50, 500 120, 533 110 C 600 90, 630 30, 666 20 C 720 10, 760 40, 800 50"
                stroke="#FF851B"
                strokeWidth="3"
                fill="none"
              />

              {/* Perfectly Aligned Data Points */}
              <circle
                cx="0"
                cy="180"
                r="4"
                fill="#FF851B"
                stroke="#fff"
                strokeWidth="2"
              />
              <circle
                cx="133"
                cy="130"
                r="4"
                fill="#FF851B"
                stroke="#fff"
                strokeWidth="2"
              />
              <circle
                cx="266"
                cy="170"
                r="4"
                fill="#FF851B"
                stroke="#fff"
                strokeWidth="2"
              />
              <circle
                cx="400"
                cy="70"
                r="4"
                fill="#FF851B"
                stroke="#fff"
                strokeWidth="2"
              />
              <circle
                cx="533"
                cy="110"
                r="4"
                fill="#FF851B"
                stroke="#fff"
                strokeWidth="2"
              />
              <circle
                cx="666"
                cy="20"
                r="4"
                fill="#FF851B"
                stroke="#fff"
                strokeWidth="2"
              />
              <circle
                cx="800"
                cy="50"
                r="4"
                fill="#FF851B"
                stroke="#fff"
                strokeWidth="2"
              />
            </svg>
          </div>

          <div className="ml-12 mt-4 flex justify-between text-[10px] font-bold text-gray-400 px-1">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>
        </div>
      </div>

      {/* --- SIMULATION MODAL --- */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#003366]/40 backdrop-blur-md animate-in fade-in"
            onClick={closeModal}
          ></div>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm relative z-10 overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock size={32} className="text-[#0074D9] animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-[#003366] mb-2">
                {modal.title}
              </h3>
              <p className="text-gray-400 text-xs mb-8 leading-relaxed">
                {modal.message}
              </p>

              <div className="bg-[#F8FAFC] rounded-xl p-4 mb-8 border border-gray-100 text-left">
                <p className="text-[9px] font-bold tracking-widest uppercase opacity-40 mb-1">
                  Action taken
                </p>
                <p className="text-[10px] font-medium text-[#003366] break-all">
                  {modal.action}
                </p>
              </div>

              <button
                onClick={closeModal}
                className="w-full bg-[#003366] text-white py-3.5 rounded-xl font-bold text-xs shadow-md"
              >
                Continue
              </button>
            </div>
            <div className="h-1.5 bg-[#FF851B] w-full"></div>
          </div>
        </div>
      )}
    </div>
  );
}
