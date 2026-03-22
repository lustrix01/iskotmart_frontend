import React, { useState, useMemo } from "react";
import {
  Package,
  Truck,
  CheckCircle2,
  ShoppingBag,
  MessageSquare,
  Info,
  Clock,
  Star,
  X,
  ArrowRight,
  ShieldCheck,
  MapPin,
} from "lucide-react";

export default function Orders() {
  const [activeTab, setActiveTab] = useState("All");
  const [notification, setNotification] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null); // For "View Details" Modal

  // --- STATEFUL MOCK DATA ---
  const [orders, setOrders] = useState([
    {
      id: "ORD-9921",
      merchant: "TechHub Electronics",
      merchantId: "M-101",
      type: "product",
      items: [
        {
          name: "Mechanical Keyboard",
          price: 2450,
          qty: 1,
          img: "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=200",
        },
      ],
      status: "To ship",
      payment: "GCash",
      mode: "Standard delivery",
      total: 2500,
      date: "Mar 22, 2026",
    },
    {
      id: "ORD-8842",
      merchant: "Creative Studio",
      merchantId: "M-202",
      type: "service",
      items: [
        {
          name: "Logo Design",
          price: 5000,
          qty: 1,
          img: "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=200",
        },
      ],
      status: "To confirm",
      payment: "Bank transfer",
      mode: "Online",
      total: 5000,
      date: "Mar 22, 2026",
    },
    {
      id: "ORD-6650",
      merchant: "IskoThreads",
      merchantId: "M-303",
      type: "product",
      items: [
        {
          name: "University Hoodie",
          price: 850,
          qty: 1,
          img: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=200",
        },
      ],
      status: "To receive",
      payment: "GCash",
      mode: "Standard delivery",
      total: 900,
      date: "Mar 20, 2026",
    },
  ]);

  // --- ACTIONS ---
  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const updateStatus = (id, newStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o)),
    );
    showToast(`Order status updated to: ${newStatus}`);
    setSelectedOrder(null);
  };

  const handleVisitShop = (mId) => {
    showToast(`Redirecting to Shop Profile...`);
    // window.location.href = `/merchant/${mId}`; // Actual logic
  };

  const filteredOrders = useMemo(
    () =>
      activeTab === "All"
        ? orders
        : orders.filter((o) => o.status === activeTab),
    [activeTab, orders],
  );

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-500 pb-20 relative">
      {/* --- TOAST --- */}
      {notification && (
        <div className="fixed top-24 right-10 z-[200] bg-[#003366] text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right">
          <CheckCircle2 size={16} className="text-green-400" />
          <span className="text-xs font-bold">{notification}</span>
        </div>
      )}

      {/* --- DETAIL MODAL --- */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[40px] w-full max-w-lg p-10 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-xl font-bold text-[#003366]">
                  Transaction details
                </h3>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-widest mt-1">
                  {selectedOrder.id}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 hover:bg-slate-100 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400 font-medium">
                  Payment method
                </span>
                <span className="text-[#003366] font-bold">
                  {selectedOrder.payment}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400 font-medium">Delivery mode</span>
                <span className="text-[#003366] font-bold">
                  {selectedOrder.mode}
                </span>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-gray-300 uppercase mb-2">
                  Item summary
                </p>
                <div className="flex justify-between font-bold text-xs text-[#003366]">
                  <span>
                    {selectedOrder.items[0].name} (x{selectedOrder.items[0].qty}
                    )
                  </span>
                  <span>₱{selectedOrder.items[0].price.toLocaleString()}</span>
                </div>
              </div>
              <div className="flex justify-between items-center pt-4 border-t">
                <span className="text-sm font-bold text-[#003366]">
                  Total paid
                </span>
                <span className="text-2xl font-black text-[#FF851B]">
                  ₱{selectedOrder.total.toLocaleString()}
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelectedOrder(null)}
              className="w-full mt-8 py-4 bg-[#003366] text-white rounded-2xl text-xs font-bold"
            >
              Close details
            </button>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#003366]">My orders</h1>
        <p className="text-xs text-gray-400 font-medium mt-1">
          Track your campus purchases and services
        </p>
      </div>

      {/* --- TABS --- */}
      <div className="bg-white border border-gray-100 rounded-2xl flex overflow-x-auto no-scrollbar shadow-sm mb-8 p-1.5">
        {[
          "All",
          "To confirm",
          "To ship",
          "To receive",
          "Completed",
          "Cancelled",
        ].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-4 py-3 text-[11px] font-bold rounded-xl transition-all ${
              activeTab === tab
                ? "bg-[#FF851B] text-white shadow-md"
                : "text-gray-400 hover:bg-gray-50"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* --- ORDERS --- */}
      <div className="space-y-6">
        {filteredOrders.map((order) => (
          <div
            key={order.id}
            className="bg-white border border-gray-100 rounded-[32px] shadow-sm overflow-hidden hover:border-orange-100 transition-all"
          >
            {/* Header */}
            <div className="px-8 py-4 bg-slate-50/50 border-b border-gray-50 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleVisitShop(order.merchantId)}
                  className="text-xs font-bold text-[#003366] hover:text-[#FF851B] transition-colors flex items-center gap-2"
                >
                  <ShoppingBag size={14} /> {order.merchant}
                </button>
                <div className="h-3 w-[1px] bg-gray-200"></div>
                <span className="text-[10px] text-gray-400 font-bold uppercase">
                  {order.id}
                </span>
              </div>
              <span className="text-[10px] font-black uppercase text-[#FF851B] bg-orange-50 px-3 py-1 rounded-lg">
                {order.status}
              </span>
            </div>

            {/* Body */}
            <div className="p-8 flex flex-col md:flex-row gap-8">
              <div className="flex gap-6 flex-grow">
                <img
                  src={order.items[0].img}
                  className="w-24 h-24 rounded-[20px] object-cover border border-gray-100 shadow-sm"
                  alt=""
                />
                <div className="flex-grow flex flex-col justify-center">
                  <h4 className="text-base font-bold text-gray-800">
                    {order.items[0].name}
                  </h4>
                  <p className="text-xs text-gray-400 font-medium mt-1">
                    Qty: {order.items[0].qty}
                  </p>
                  <div className="flex flex-wrap gap-4 mt-4">
                    <Label icon={<Truck size={12} />} text={order.mode} />
                    <Label
                      icon={<ShieldCheck size={12} />}
                      text={order.payment}
                    />
                  </div>
                </div>
              </div>

              <div className="md:w-64 bg-slate-50 rounded-3xl p-5 border border-slate-100 self-center">
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2">
                  Live update
                </p>
                <p className="text-xs text-[#003366] font-bold leading-relaxed italic">
                  {order.status === "To ship"
                    ? "Merchant is packing your item..."
                    : order.status === "To confirm"
                      ? "Pending merchant acceptance."
                      : order.status === "To receive"
                        ? "Rider is heading to your location."
                        : "Order finalized."}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-5 bg-slate-50/20 border-t border-gray-50 flex flex-col sm:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                  Grand Total
                </span>
                <span className="text-2xl font-black text-[#FF851B]">
                  ₱{order.total.toLocaleString()}
                </span>
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                {/* BUTTON LOGIC */}
                {order.status === "To confirm" && (
                  <button
                    onClick={() => updateStatus(order.id, "Cancelled")}
                    className="flex-grow px-6 py-3 border border-red-100 text-red-500 text-xs font-bold rounded-2xl hover:bg-red-50 transition-all"
                  >
                    Cancel order
                  </button>
                )}
                {order.status === "To receive" && (
                  <button
                    onClick={() => updateStatus(order.id, "Completed")}
                    className="flex-grow px-6 py-3 bg-green-600 text-white text-xs font-bold rounded-2xl hover:bg-green-700 transition-all shadow-md"
                  >
                    Confirm receipt
                  </button>
                )}
                {order.status === "Completed" && (
                  <button
                    onClick={() => showToast("Opening Review Center...")}
                    className="flex-grow px-6 py-3 bg-[#FF851B] text-white text-xs font-bold rounded-2xl hover:bg-[#e67616] transition-all"
                  >
                    Rate product
                  </button>
                )}

                <button
                  onClick={() => setSelectedOrder(order)}
                  className="flex-grow px-6 py-3 bg-white border border-gray-100 text-[#003366] text-xs font-bold rounded-2xl hover:bg-gray-50"
                >
                  View details
                </button>
                <button
                  onClick={() => showToast("Opening IskoChat...")}
                  className="p-3 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-100 transition-all"
                >
                  <MessageSquare size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Label({ icon, text }) {
  return (
    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
      <span className="text-gray-300">{icon}</span> {text}
    </div>
  );
}
