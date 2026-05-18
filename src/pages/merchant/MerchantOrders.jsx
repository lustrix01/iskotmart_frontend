import React, { useEffect, useState, useMemo } from "react";
import {
  Search,
  Filter,
  Truck,
  CheckCircle2,
  Clock,
  CreditCard,
  MapPin,
  Phone,
  User,
  Package,
  X,
  ArrowUpRight,
  AlertCircle,
  Printer,
} from "lucide-react";

export default function MerchantOrders() {
  const [searchTerm, setSearchTerm] = useState("");
  // --- FR-48 & FR-49: Tabs for filtering Ongoing vs Historical Orders ---
  const [activeTab, setActiveTab] = useState("All");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loadError, setLoadError] = useState("");

  const [orders, setOrders] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const loadOrders = async () => {
      try {
        const response = await fetch("/api/merchant_orders.php", {
          credentials: "include",
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload.error || "Unable to load merchant orders.");
        }
        if (isMounted) {
          setOrders(payload.orders || []);
          setLoadError("");
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(error.message);
        }
      }
    };

    loadOrders();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.includes(searchTerm);
      const matchesTab = activeTab === "All" || order.status === activeTab;
      return matchesSearch && matchesTab;
    });
  }, [searchTerm, activeTab, orders]);

  const updateStatus = async (id, newStatus) => {
    const order = orders.find((item) => item.id === id);
    if (!order) {
      return;
    }

    try {
      const response = await fetch("/api/merchant_orders.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          source: order.source,
          rawId: order.rawId,
          status: newStatus,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Unable to update order status.");
      }

      const nextOrders = payload.orders || [];
      setOrders(nextOrders);
      setSelectedOrder(
        nextOrders.find((item) => item.id === id) || {
          ...order,
          status: newStatus,
        },
      );
      setLoadError("");
    } catch (error) {
      setLoadError(error.message);
    }
  };

  const markPaymentPaid = async (id) => {
    const order = orders.find((item) => item.id === id);
    if (!order) {
      return;
    }

    try {
      const response = await fetch("/api/merchant_orders.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          source: order.source,
          rawId: order.rawId,
          action: "mark_paid",
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Unable to mark payment as paid.");
      }

      const nextOrders = payload.orders || [];
      setOrders(nextOrders);
      setSelectedOrder(nextOrders.find((item) => item.id === id) || null);
      setLoadError("");
    } catch (error) {
      setLoadError(error.message);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "Pending":
        return "bg-orange-100 text-[#FF851B] border-orange-200";
      case "Confirmed":
        return "bg-blue-100 text-[#0074D9] border-blue-200";
      case "Shipped":
        return "bg-purple-100 text-purple-600 border-purple-200";
      case "Completed":
        return "bg-green-100 text-green-600 border-green-200";
      case "Cancelled":
        return "bg-red-100 text-red-600 border-red-200";
      default:
        return "bg-gray-100 text-gray-500 border-gray-200";
    }
  };

  const isPaid = (order) => order?.paymentStatusCode === "PAID";

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      {loadError && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-xs font-bold text-red-600">
          {loadError}
        </div>
      )}
      {/* 1. QUICK STATS OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {
            label: "Pending",
            count: orders.filter((o) => o.status === "Pending").length,
            color: "text-[#FF851B]",
            bg: "bg-orange-50",
          },
          {
            label: "To Ship",
            count: orders.filter((o) => o.status === "Confirmed").length,
            color: "text-[#0074D9]",
            bg: "bg-blue-50",
          },
          {
            label: "In Transit",
            count: orders.filter((o) => o.status === "Shipped").length,
            color: "text-purple-500",
            bg: "bg-purple-50",
          },
          {
            label: "Completed",
            count: orders.filter((o) => o.status === "Completed").length,
            color: "text-green-500",
            bg: "bg-green-50",
          },
        ].map((s, i) => (
          <div
            key={i}
            className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between"
          >
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {s.label}
              </p>
              <p className={`text-2xl font-black ${s.color}`}>{s.count}</p>
            </div>
            <div className={`p-3 rounded-xl ${s.bg}`}>
              <Package size={20} className={s.color} />
            </div>
          </div>
        ))}
      </div>

      {/* 2. TAB NAVIGATION (FR-48 & FR-49) */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col lg:flex-row justify-between items-center gap-4">
        <div className="flex gap-2 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0">
          {[
            "All",
            "Pending",
            "Confirmed",
            "Shipped",
            "Completed",
            "Cancelled",
          ].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === tab
                  ? "bg-[#003366] text-white shadow-lg"
                  : "text-gray-400 hover:bg-gray-50"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="relative w-full lg:w-80">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"
            size={16}
          />
          <input
            type="text"
            placeholder="Search Order ID or Customer..."
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-xs focus:ring-2 focus:ring-[#FF851B]/20 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* 3. PROFESSIONAL ORDERS TABLE */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[#F8FAFC] text-[10px] font-bold text-[#003366] uppercase tracking-[0.15em] border-b border-gray-100">
                <th className="p-5 pl-8">Order ID</th>
                <th className="p-5">Customer</th>
                <th className="p-5">Total Amount</th>
                <th className="p-5">Method</th>
                <th className="p-5 text-center">Status</th>
                <th className="p-5 pr-8 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="text-xs font-medium text-gray-600">
              {filteredOrders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-gray-50 hover:bg-gray-50/30 transition-colors group"
                >
                  <td className="p-5 pl-8 font-mono text-[#0074D9] font-bold">
                    {order.id}
                  </td>
                  <td className="p-5">
                    <div className="flex flex-col">
                      <span className="text-gray-900 font-bold">
                        {order.customer}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {order.date}
                      </span>
                    </div>
                  </td>
                  <td className="p-5 font-bold text-[#003366]">
                    ₱{order.total.toLocaleString()}
                  </td>
                  <td className="p-5 text-gray-500 font-semibold">
                    {order.method}
                  </td>
                  <td className="p-5">
                    <div
                      className={`mx-auto w-fit px-3 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wider ${getStatusStyle(order.status)}`}
                    >
                      {order.status}
                    </div>
                  </td>
                  <td className="p-5 pr-8 text-right">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="p-2.5 bg-gray-50 text-[#003366] rounded-xl hover:bg-[#003366] hover:text-white transition-all shadow-sm"
                    >
                      <ArrowUpRight size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="p-10 text-center text-xs font-bold text-gray-400"
                  >
                    No database orders found for this merchant.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. THE ACTION DRAWER */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div
            className="absolute inset-0 bg-[#003366]/60 backdrop-blur-md animate-in fade-in"
            onClick={() => setSelectedOrder(null)}
          ></div>
          <div className="relative w-full max-w-xl bg-[#F8FAFC] h-screen shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="p-6 bg-white border-b border-gray-100 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-orange-50 text-[#FF851B] rounded-xl">
                  <Package size={20} />
                </div>
                <h3 className="text-lg font-bold text-[#003366]">
                  Manage Order {selectedOrder.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-6 overflow-y-auto flex-grow">
              {/* ACTION BAR */}
              {selectedOrder.status !== "Completed" &&
                selectedOrder.status !== "Cancelled" && (
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      Update Order Flow
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {selectedOrder.status === "Pending" && (
                        <>
                          <button
                            onClick={() =>
                              updateStatus(selectedOrder.id, "Confirmed")
                            }
                            className="flex-1 bg-[#0074D9] text-white py-3 rounded-xl text-xs font-bold hover:shadow-lg transition-all"
                          >
                            Confirm Order
                          </button>
                          <button
                            onClick={() =>
                              updateStatus(selectedOrder.id, "Cancelled")
                            }
                            className="px-6 py-3 border border-red-100 text-red-500 rounded-xl text-xs font-bold hover:bg-red-50 transition-all"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      {selectedOrder.status === "Confirmed" && (
                        <button
                          onClick={() =>
                            updateStatus(selectedOrder.id, "Shipped")
                          }
                          className="flex-1 bg-purple-600 text-white py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
                        >
                          <Truck size={16} /> Mark as Shipped
                        </button>
                      )}
                      {selectedOrder.status === "Shipped" && (
                        <>
                          <button
                            onClick={() =>
                              updateStatus(selectedOrder.id, "Completed")
                            }
                            disabled={!isPaid(selectedOrder)}
                            className="flex-1 bg-green-500 text-white py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <CheckCircle2 size={16} /> Complete Delivery
                          </button>
                          {!isPaid(selectedOrder) && (
                            <p className="w-full text-[10px] font-bold text-red-500">
                              Payment must be marked paid before completion.
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}

              {selectedOrder.status !== "Completed" &&
                selectedOrder.status !== "Cancelled" &&
                !isPaid(selectedOrder) && (
                  <div className="bg-white p-6 rounded-3xl border border-orange-100 shadow-sm space-y-3">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      Payment confirmation
                    </p>
                    <p className="text-xs text-gray-500 font-semibold">
                      {selectedOrder.paymentStatusCode ===
                      "PENDING_PAYMENT_REVIEW"
                        ? "Review the GCash reference before marking this payment as paid."
                        : "Mark COD as paid after collecting cash from the buyer."}
                    </p>
                    {selectedOrder.paymentReference && (
                      <p className="text-[11px] font-bold text-[#003366]">
                        Reference: {selectedOrder.paymentReference}
                      </p>
                    )}
                    <button
                      onClick={() => markPaymentPaid(selectedOrder.id)}
                      className="w-full bg-[#FF851B] text-white py-3 rounded-xl text-xs font-bold hover:shadow-lg transition-all"
                    >
                      {selectedOrder.paymentStatusCode ===
                      "PENDING_PAYMENT_REVIEW"
                        ? "Confirm GCash as paid"
                        : "Mark COD as paid"}
                    </button>
                  </div>
                )}

              {/* INFO CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-bold text-[#FF851B] uppercase mb-3">
                    Customer Details
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-xs font-bold text-[#003366]">
                      <User size={14} className="text-gray-300" />{" "}
                      {selectedOrder.customer}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-gray-500 font-medium">
                      <Phone size={14} className="text-gray-300" />{" "}
                      {selectedOrder.phone}
                    </div>
                    <div className="flex items-start gap-3 text-[11px] text-gray-500 font-medium">
                      <MapPin size={14} className="text-gray-300 shrink-0" />{" "}
                      {selectedOrder.address}
                    </div>
                  </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-bold text-[#FF851B] uppercase mb-3">
                    Payment Info
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-xs font-bold text-[#003366]">
                      <CreditCard size={14} className="text-gray-300" />{" "}
                      {selectedOrder.paymentMethod || selectedOrder.method}
                    </div>
                    <div
                      className={`w-fit px-2 py-1 rounded text-[9px] font-black uppercase ${isPaid(selectedOrder) ? "bg-green-50 text-green-500" : "bg-red-50 text-red-500"}`}
                    >
                      {selectedOrder.paymentStatus}
                    </div>
                  </div>
                </div>
              </div>

              {/* ITEM SUMMARY */}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="bg-[#F8FAFC] px-5 py-3 border-b border-gray-100 text-[10px] font-bold text-[#003366] uppercase">
                  Order Items
                </div>
                <div className="p-5 space-y-4">
                  {selectedOrder.items.map((item, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center text-gray-300">
                          <Package size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-800">
                            {item.name}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            Qty: {item.qty}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs font-black text-[#003366]">
                        ₱{(item.price * item.qty).toLocaleString()}
                      </p>
                    </div>
                  ))}
                  <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">
                      Total Settlement
                    </p>
                    <p className="text-xl font-black text-[#FF851B]">
                      ₱{selectedOrder.total.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white border-t border-gray-100 flex gap-3 shrink-0">
              <button className="flex-1 py-3 rounded-xl border border-gray-100 text-[10px] font-bold text-gray-500 flex items-center justify-center gap-2 hover:bg-gray-50">
                <Printer size={16} /> Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
