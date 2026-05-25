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
  Undo2,
} from "lucide-react";

export default function MerchantOrders() {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewTab, setViewTab] = useState("Orders");
  const [logSearchTerm, setLogSearchTerm] = useState("");
  // --- FR-48 & FR-49: Tabs for filtering Ongoing vs Historical Orders ---
  const [activeTab, setActiveTab] = useState("All");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionNotice, setActionNotice] = useState(null);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

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

  const logSearchValue = logSearchTerm.trim().toUpperCase();
  const activityEntries = useMemo(() => {
    const entries = orders.flatMap((order) =>
      (order.activityLog || []).map((entry, index) => ({
        ...entry,
        order,
        isLatestForOrder: index === 0,
      })),
    );

    const filtered = logSearchValue
      ? entries.filter((entry) => {
          const order = entry.order;
          const haystack = [
            order.id,
            order.rawId,
            order.customer,
            order.status,
            entry.summary,
            itemSummary(entry.items),
          ]
            .join(" ")
            .toUpperCase();
          return haystack.includes(logSearchValue);
        })
      : entries;

    return filtered.sort((a, b) => {
      const aTime = Date.parse(a.createdAt || "") || 0;
      const bTime = Date.parse(b.createdAt || "") || 0;
      if (aTime !== bTime) {
        return bTime - aTime;
      }
      return Number(b.id || 0) - Number(a.id || 0);
    });
  }, [logSearchValue, orders]);

  const syncOrderState = (
    nextOrders,
    id,
    fallback = null,
    updateSelected = true,
  ) => {
    setOrders(nextOrders);
    const nextSelected = nextOrders.find((item) => item.id === id) || fallback;
    if (updateSelected) {
      setSelectedOrder(nextSelected);
    }
    return nextSelected;
  };

  const latestUndoableLog = (order) => {
    const latest = order?.activityLog?.[0];
    if (
      latest?.actorRole === "merchant" &&
      ["status_changed", "payment_confirmed"].includes(latest.eventType)
    ) {
      return latest;
    }
    return null;
  };

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
      const nextSelected = syncOrderState(nextOrders, id, {
        ...order,
        status: newStatus,
      });
      setActionNotice({
        message: `Order ${id} changed from ${order.status} to ${newStatus}.`,
        undoLog: latestUndoableLog(nextSelected),
      });
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
      const nextSelected = syncOrderState(nextOrders, id, null);
      setActionNotice({
        message: `Payment for ${id} was marked as paid.`,
        undoLog: latestUndoableLog(nextSelected),
      });
      setLoadError("");
    } catch (error) {
      setLoadError(error.message);
    }
  };

  const undoOrderAction = async (order, log) => {
    if (!order || !log) {
      return;
    }

    setIsSubmittingAction(true);
    try {
      const response = await fetch("/api/merchant_orders.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          source: order.source,
          rawId: order.rawId,
          action: "undo",
          logId: log.id,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Unable to undo this order action.");
      }

      const nextOrders = payload.orders || [];
      syncOrderState(nextOrders, order.id, order, selectedOrder?.id === order.id);
      setActionNotice({
        message: `Undid the latest action for ${order.id}.`,
        undoLog: null,
      });
      setLoadError("");
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const openStatusConfirmation = (order, newStatus) => {
    setConfirmAction({
      type: "status",
      orderId: order.id,
      currentValue: order.status,
      targetValue: newStatus,
      title: "Update order flow?",
      description: "This will update the customer-visible order status.",
      confirmLabel: newStatus === "Cancelled" ? "Cancel order" : `Mark ${newStatus}`,
    });
  };

  const openPaymentConfirmation = (order) => {
    setConfirmAction({
      type: "payment",
      orderId: order.id,
      currentValue: order.paymentStatus,
      targetValue: "Paid",
      title: "Confirm payment?",
      description: "Confirm only after reviewing the payment reference, proof, or COD collection.",
      confirmLabel: "Confirm payment",
    });
  };

  const executeConfirmedAction = async () => {
    if (!confirmAction) {
      return;
    }

    setIsSubmittingAction(true);
    try {
      if (confirmAction.type === "payment") {
        await markPaymentPaid(confirmAction.orderId);
      } else {
        await updateStatus(confirmAction.orderId, confirmAction.targetValue);
      }
      setConfirmAction(null);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const escapeReceiptValue = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const money = (value) => Number(value || 0).toLocaleString();

  const paymentActivityLabel = (value) => {
    switch (String(value || "").toUpperCase()) {
      case "PAID":
        return "Paid";
      case "PENDING_PAYMENT_REVIEW":
        return "Pending payment review";
      case "UNPAID":
        return "Unpaid";
      default:
        return value || "None";
    }
  };

  const activityEventLabel = (eventType) => {
    const labels = {
      created: "Order received",
      status_changed: "Status updated",
      payment_confirmed: "Payment confirmed",
      customer_cancelled: "Customer cancelled",
      customer_received: "Customer received",
      undo: "Action undone",
    };
    return labels[eventType] || "Order activity";
  };

  const activityValue = (entry, key) =>
    entry.eventType === "payment_confirmed"
      ? paymentActivityLabel(entry[key])
      : entry[key] || "";

  const itemSummary = (items = []) =>
    items
      .map((item) => `${item.name} x${item.qty}`)
      .filter(Boolean)
      .join(", ");

  const renderActivityEntry = (entry, order, canUndo) => {
    const oldValue = activityValue(entry, "oldValue");
    const newValue = activityValue(entry, "newValue");

    return (
      <div
        key={`${order.id}-${entry.id}`}
        className="rounded-2xl border border-gray-100 bg-[#F8FAFC] p-4"
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-mono text-xs font-black text-[#0074D9]">
                {order.id}
              </p>
              <span
                className={`rounded-md border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${getStatusStyle(order.status)}`}
              >
                {order.status}
              </span>
            </div>
            <p className="mt-2 text-xs font-black text-[#003366]">
              {activityEventLabel(entry.eventType)}
            </p>
            <p className="mt-1 text-[10px] font-bold text-gray-400">
              {entry.createdAtLabel} by {entry.actorName}{" "}
              {entry.actorRole ? `(${entry.actorRole})` : ""}
            </p>
            <p className="mt-1 text-[10px] font-bold text-gray-400">
              Customer: {order.customer}
            </p>
          </div>
          {canUndo && (
            <button
              onClick={() => undoOrderAction(order, entry)}
              disabled={isSubmittingAction}
              className="inline-flex shrink-0 items-center justify-center gap-1 rounded-lg bg-white px-3 py-2 text-[10px] font-black text-[#0074D9] shadow-sm hover:bg-blue-50 disabled:opacity-50"
            >
              <Undo2 size={13} /> Undo
            </button>
          )}
        </div>
        {(oldValue || newValue) && (
          <p className="mt-3 text-[11px] font-bold text-gray-600">
            {oldValue || "None"} <span className="text-gray-300">to</span>{" "}
            {newValue || "None"}
          </p>
        )}
        {entry.summary && (
          <p className="mt-2 text-[11px] font-semibold leading-relaxed text-gray-500">
            {entry.summary}
          </p>
        )}
        {itemSummary(entry.items) && (
          <p className="mt-2 text-[10px] font-bold text-gray-400">
            Items: {itemSummary(entry.items)}
          </p>
        )}
      </div>
    );
  };

  const serviceRequirementRows = (requirements = {}) =>
    [
      ["Deadline", requirements.deadline],
      ["Package", requirements.package],
      ["Business Type", requirements.businessType],
      ["Brief", requirements.brief],
      ["Notes", requirements.note],
    ].filter(([, value]) => String(value || "").trim() !== "");

  const printReceipt = (order) => {
    const receiptWindow = window.open("", "_blank", "width=720,height=900");
    if (!receiptWindow) {
      setLoadError("Allow popups to print the receipt.");
      return;
    }

    const itemRows = order.items
      .map((item) => {
        const qty = Number(item.qty || 0);
        const price = Number(item.price || 0);
        return `
          <tr>
            <td>${escapeReceiptValue(item.name)}</td>
            <td style="text-align:center;">${qty}</td>
            <td style="text-align:right;">PHP ${money(price)}</td>
            <td style="text-align:right;">PHP ${money(price * qty)}</td>
          </tr>
        `;
      })
      .join("");
    const requirementRows = serviceRequirementRows(order.serviceRequirements)
      .map(
        ([label, value]) =>
          `<div class="row"><strong>${escapeReceiptValue(label)}</strong><span>${escapeReceiptValue(value)}</span></div>`,
      )
      .join("");

    receiptWindow.document.write(`
      <html>
        <head>
          <title>Receipt ${escapeReceiptValue(order.id)}</title>
          <style>
            body { font-family: Arial, sans-serif; color: #1f2937; padding: 32px; }
            h1 { color: #003366; margin: 0 0 4px; }
            .muted { color: #6b7280; font-size: 12px; }
            .row { display: flex; justify-content: space-between; gap: 24px; margin: 8px 0; }
            .row span { text-align: right; }
            table { width: 100%; border-collapse: collapse; margin-top: 24px; }
            th, td { border-bottom: 1px solid #e5e7eb; padding: 10px; font-size: 12px; }
            th { text-align: left; color: #003366; background: #f9fafb; }
            .total { font-size: 22px; font-weight: 800; color: #ff851b; }
            .footer { margin-top: 28px; font-size: 11px; color: #6b7280; }
          </style>
        </head>
        <body>
          <h1>IskoMart Merchant Receipt</h1>
          <p class="muted">Generated from merchant order record ${escapeReceiptValue(order.id)}</p>
          <div style="margin-top: 24px;">
            <div class="row"><strong>Customer</strong><span>${escapeReceiptValue(order.customer)}</span></div>
            <div class="row"><strong>Email</strong><span>${escapeReceiptValue(order.email || "Not provided")}</span></div>
            <div class="row"><strong>Phone</strong><span>${escapeReceiptValue(order.phone || "Not provided")}</span></div>
            <div class="row"><strong>Address</strong><span>${escapeReceiptValue(order.address || "Not provided")}</span></div>
            <div class="row"><strong>Date</strong><span>${escapeReceiptValue(order.date)}</span></div>
            <div class="row"><strong>Status</strong><span>${escapeReceiptValue(order.status)}</span></div>
            <div class="row"><strong>Payment</strong><span>${escapeReceiptValue(order.paymentMethod || order.method)}</span></div>
            <div class="row"><strong>Payment status</strong><span>${escapeReceiptValue(order.paymentStatus)}</span></div>
	            <div class="row"><strong>Reference</strong><span>${escapeReceiptValue(order.paymentReference || "N/A")}</span></div>
	            <div class="row"><strong>Delivery mode</strong><span>${escapeReceiptValue(order.method)}</span></div>
	          </div>
	          ${
              requirementRows
                ? `<div style="margin-top: 24px;"><h2 style="font-size: 14px; color: #003366;">Service Requirements</h2>${requirementRows}</div>`
                : ""
            }
	          <table>
            <thead>
              <tr><th>Item</th><th style="text-align:center;">Qty</th><th style="text-align:right;">Price</th><th style="text-align:right;">Line Total</th></tr>
            </thead>
            <tbody>${itemRows}</tbody>
          </table>
          <div class="row" style="margin-top: 24px;">
            <strong>Total</strong><span class="total">PHP ${money(order.total)}</span>
          </div>
          <p class="footer">Receipt values are based on the selected merchant order record displayed in IskoMart.</p>
          <script>
            window.onload = () => {
              window.focus();
              setTimeout(() => window.print(), 150);
            };
          </script>
        </body>
      </html>
    `);
    receiptWindow.document.close();
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
  const orderStages = ["Pending", "Confirmed", "Shipped", "Completed"];
  const stageIndex = (status) => orderStages.indexOf(status);

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      {loadError && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-xs font-bold text-red-600">
          {loadError}
        </div>
      )}
      <div className="bg-white p-2 rounded-2xl border border-gray-100 shadow-sm flex w-full max-w-sm gap-2">
        {["Orders", "Logs"].map((tab) => (
          <button
            key={tab}
            onClick={() => setViewTab(tab)}
            className={`flex-1 rounded-xl px-4 py-3 text-xs font-black transition-all ${
              viewTab === tab
                ? "bg-[#003366] text-white shadow-sm"
                : "text-gray-400 hover:bg-gray-50"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {viewTab === "Orders" && (
        <>
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
                      onClick={() => {
                        setSelectedOrder(order);
                        setActionNotice(null);
                      }}
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
        </>
      )}

      {viewTab === "Logs" && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
          <div className="border-b border-gray-100 bg-[#F8FAFC] p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#003366]">
              Order Activity Logs
            </p>
	            <div className="relative mt-4 max-w-md">
	              <Search
	                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"
	                size={16}
	              />
	              <input
	                type="text"
	                placeholder="Filter by order ID, customer, or item"
	                className="w-full rounded-2xl border border-gray-100 bg-white py-3 pl-12 pr-4 text-xs font-bold outline-none transition-all focus:ring-2 focus:ring-[#FF851B]/20"
	                value={logSearchTerm}
	                onChange={(event) => setLogSearchTerm(event.target.value)}
	              />
	            </div>
	          </div>
	          <div className="p-5">
	            {activityEntries.length === 0 && !logSearchValue && (
	              <p className="py-10 text-center text-xs font-bold text-gray-400">
	                No order activity has been logged yet.
	              </p>
	            )}
	            {activityEntries.length === 0 && logSearchValue && (
	              <p className="py-10 text-center text-xs font-bold text-gray-400">
	                No activity logs matched {logSearchTerm}.
	              </p>
	            )}
	            {activityEntries.length > 0 && (
	              <div className="space-y-4">
	                {activityEntries.map((entry) =>
	                  renderActivityEntry(
	                    entry,
	                    entry.order,
	                    entry.isLatestForOrder &&
	                      entry.actorRole === "merchant" &&
	                      ["status_changed", "payment_confirmed"].includes(
	                        entry.eventType,
	                      ),
	                  ),
	                )}
	              </div>
	            )}
	          </div>
	        </div>
      )}

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
	              <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
	                <div className="flex items-center justify-between gap-3">
	                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
	                    Current Order Stage
	                  </p>
	                  <div
	                    className={`w-fit px-3 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wider ${getStatusStyle(selectedOrder.status)}`}
	                  >
	                    {selectedOrder.status}
	                  </div>
	                </div>
	                {selectedOrder.status === "Cancelled" ? (
	                  <p className="mt-4 text-xs font-bold text-red-500">
	                    This order was cancelled.
	                  </p>
	                ) : (
	                  <div className="mt-4 grid grid-cols-4 gap-2">
	                    {orderStages.map((stage, index) => {
	                      const currentIndex = stageIndex(selectedOrder.status);
	                      const isCurrent = selectedOrder.status === stage;
	                      const isReached = currentIndex >= 0 && index <= currentIndex;
	                      return (
	                        <div key={stage} className="min-w-0">
	                          <div
	                            className={`h-2 rounded-full ${
	                              isCurrent
	                                ? "bg-[#FF851B]"
	                                : isReached
	                                  ? "bg-green-500"
	                                  : "bg-gray-200"
	                            }`}
	                          ></div>
	                          <p
	                            className={`mt-2 truncate text-center text-[9px] font-black uppercase ${
	                              isCurrent
	                                ? "text-[#FF851B]"
	                                : isReached
	                                  ? "text-green-600"
	                                  : "text-gray-400"
	                            }`}
	                          >
	                            {stage}
	                          </p>
	                        </div>
	                      );
	                    })}
	                  </div>
	                )}
	              </div>

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
                              openStatusConfirmation(selectedOrder, "Confirmed")
                            }
                            className="flex-1 bg-[#0074D9] text-white py-3 rounded-xl text-xs font-bold hover:shadow-lg transition-all"
                          >
                            Confirm Order
                          </button>
                          <button
                            onClick={() =>
                              openStatusConfirmation(selectedOrder, "Cancelled")
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
                            openStatusConfirmation(selectedOrder, "Shipped")
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
                              openStatusConfirmation(selectedOrder, "Completed")
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
                        ? "Review the GCash reference and uploaded proof before marking this payment as paid."
                        : "Mark COD as paid after collecting cash from the buyer."}
                    </p>
                    {selectedOrder.paymentReference && (
                      <p className="text-[11px] font-bold text-[#003366]">
                        Reference: {selectedOrder.paymentReference}
                      </p>
                    )}
                    {selectedOrder.paymentProofUrl && (
                      <a
                        href={selectedOrder.paymentProofUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex text-[11px] font-bold text-[#0074D9] hover:underline"
                      >
                        View uploaded proof
                      </a>
                    )}
                    <button
                      onClick={() => openPaymentConfirmation(selectedOrder)}
                      className="w-full bg-[#FF851B] text-white py-3 rounded-xl text-xs font-bold hover:shadow-lg transition-all"
                    >
                      {selectedOrder.paymentStatusCode ===
                      "PENDING_PAYMENT_REVIEW"
                        ? "Confirm GCash as paid"
                        : "Mark COD as paid"}
                    </button>
                  </div>
                )}

              {actionNotice && (
                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <p className="text-xs font-bold text-[#003366]">
                    {actionNotice.message}
                  </p>
                  {actionNotice.undoLog && (
                    <button
                      onClick={() =>
                        undoOrderAction(selectedOrder, actionNotice.undoLog)
                      }
                      disabled={isSubmittingAction}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-[11px] font-black text-[#0074D9] shadow-sm hover:bg-blue-100 disabled:opacity-50"
                    >
                      <Undo2 size={14} /> Undo
                    </button>
                  )}
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
	                {serviceRequirementRows(selectedOrder.serviceRequirements).length > 0 && (
	                  <div className="bg-white p-5 rounded-2xl border border-gray-100 md:col-span-2">
	                    <p className="text-[10px] font-bold text-[#FF851B] uppercase mb-3">
	                      Service Requirements
	                    </p>
	                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
	                      {serviceRequirementRows(selectedOrder.serviceRequirements).map(
	                        ([label, value]) => (
	                          <div key={label} className="rounded-xl bg-[#F8FAFC] p-3">
	                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">
	                              {label}
	                            </p>
	                            <p className="mt-1 text-xs font-bold text-[#003366] leading-relaxed">
	                              {value}
	                            </p>
	                          </div>
	                        ),
	                      )}
	                    </div>
	                  </div>
	                )}
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
              <button
                onClick={() => printReceipt(selectedOrder)}
                className="flex-1 py-3 rounded-xl border border-gray-100 text-[10px] font-bold text-gray-500 flex items-center justify-center gap-2 hover:bg-gray-50"
              >
                <Printer size={16} /> Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
      {confirmAction && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#003366]/50 backdrop-blur-sm"
            onClick={() => setConfirmAction(null)}
          ></div>
          <div className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="p-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-[#FF851B]">
                <AlertCircle size={24} />
              </div>
              <h3 className="text-lg font-black text-[#003366]">
                {confirmAction.title}
              </h3>
              <p className="mt-2 text-xs font-semibold leading-relaxed text-gray-500">
                {confirmAction.description}
              </p>
              <div className="mt-5 rounded-2xl bg-[#F8FAFC] p-4 text-left">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Order
                </p>
	                <p className="mt-1 text-sm font-black text-[#003366]">
	                  {confirmAction.orderId}
	                </p>
	                <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-xs font-bold">
                  <span className="rounded-xl bg-white px-3 py-2 text-gray-500">
                    {confirmAction.currentValue || "None"}
                  </span>
                  <span className="text-gray-300">to</span>
                  <span className="rounded-xl bg-white px-3 py-2 text-[#0074D9]">
                    {confirmAction.targetValue}
                  </span>
                </div>
                {selectedOrder && (
                  <p className="mt-3 text-[10px] font-bold leading-relaxed text-gray-400">
                    Items: {itemSummary(selectedOrder.items)}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-3 border-t border-gray-100 bg-[#F8FAFC] p-4">
              <button
                onClick={() => setConfirmAction(null)}
                disabled={isSubmittingAction}
                className="flex-1 rounded-xl border border-gray-200 bg-white py-3 text-xs font-black text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                Keep current
              </button>
              <button
                onClick={executeConfirmedAction}
                disabled={isSubmittingAction}
                className="flex-1 rounded-xl bg-[#003366] py-3 text-xs font-black text-white hover:bg-[#00284f] disabled:opacity-50"
              >
                {isSubmittingAction ? "Updating..." : confirmAction.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
