import React, { useState, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
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
  AlertCircle,
  Camera,
  Plus,
  Image as ImageIcon,
} from "lucide-react";

export default function Orders() {
  // --- FR-27: Allow customers to track the status of their orders ---
  const [activeTab, setActiveTab] = useState("All");

  const [notification, setNotification] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null); // For "View Details" Modal

  // Modal states for FR-25 and FR-26
  const [cancelTarget, setCancelTarget] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);

  // --- FR-15: Rating & Review States ---
  const [ratingTarget, setRatingTarget] = useState(null); // For the Review Modal
  const [ratingValue, setRatingValue] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewImage, setReviewImage] = useState(null); // Holds the uploaded picture
  const fileInputRef = useRef(null);

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
      status: "To confirm", // Can be cancelled (FR-26)
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
      status: "To receive", // Waiting for customer confirmation (FR-25)
      payment: "GCash",
      mode: "Standard delivery",
      total: 900,
      date: "Mar 20, 2026",
    },
    {
      id: "ORD-1122",
      merchant: "BU Prints",
      merchantId: "M-404",
      type: "product",
      items: [
        {
          name: "Lanyard & ID Lace",
          price: 150,
          qty: 2,
          img: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=200",
        },
      ],
      status: "Completed",
      payment: "Cash on Delivery",
      mode: "Campus Meetup",
      total: 300,
      date: "Mar 15, 2026",
    },
  ]);

  // --- ACTIONS ---
  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // --- FR-26: Cancel Order Logic ---
  const handleCancelOrder = () => {
    if (cancelTarget) {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === cancelTarget ? { ...o, status: "Cancelled" } : o,
        ),
      );
      showToast(`Order ${cancelTarget} has been cancelled.`);
      setCancelTarget(null);
    }
  };

  // --- FR-25: Confirm Order Logic ---
  const handleConfirmReceipt = () => {
    if (confirmTarget) {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === confirmTarget ? { ...o, status: "Completed" } : o,
        ),
      );
      showToast(`Order ${confirmTarget} marked as completed!`);
      setConfirmTarget(null);
    }
  };

  const handleVisitShop = (mId) => {
    showToast(`Redirecting to Shop Profile...`);
  };

  // --- FR-15: Review Submission ---
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitReview = (e) => {
    e.preventDefault();
    // In a real app, you would send ratingTarget.id, ratingValue, reviewComment, and reviewImage to the server.
    showToast(`Review submitted for ${ratingTarget.merchant}! Thank you.`);
    // Reset states
    setRatingTarget(null);
    setRatingValue(5);
    setReviewComment("");
    setReviewImage(null);
  };

  const filteredOrders = useMemo(
    () =>
      activeTab === "All"
        ? orders
        : orders.filter((o) => o.status === activeTab),
    [activeTab, orders],
  );

  // Helper for dynamic tracking text
  const getLiveUpdateText = (status) => {
    switch (status) {
      case "To confirm":
        return "Pending merchant acceptance. You can still cancel.";
      case "To ship":
        return "Merchant is preparing your item...";
      case "To receive":
        return "Rider is heading to your location/Meetup ready.";
      case "Completed":
        return "Transaction finalized. Thank you!";
      case "Cancelled":
        return "This order was cancelled.";
      default:
        return "Processing...";
    }
  };

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-500 pb-20 relative text-black">
      {/* --- TOAST --- */}
      {notification && (
        <div className="fixed top-24 right-10 z-[200] bg-[#003366] text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right font-sans">
          <CheckCircle2 size={16} className="text-green-400" />
          <span className="text-xs font-bold">{notification}</span>
        </div>
      )}

      {/* --- DETAIL MODAL --- */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[40px] w-full max-w-lg p-10 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-start mb-8 font-sans">
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
                className="p-2 hover:bg-slate-100 rounded-full text-gray-400"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6 font-sans">
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
              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
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
              className="w-full mt-8 py-4 bg-[#003366] text-white rounded-2xl text-xs font-bold hover:bg-[#002244] transition-colors font-sans"
            >
              Close details
            </button>
          </div>
        </div>
      )}

      {/* --- FR-15: REVIEW & RATING MODAL (With Picture Upload) --- */}
      {ratingTarget && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-[40px] w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 relative font-sans">
            <button
              onClick={() => setRatingTarget(null)}
              className="absolute top-6 right-6 p-2 text-gray-300 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-orange-50 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-orange-100">
                <ImageIcon size={32} className="text-[#FF851B]" />
              </div>
              <h3 className="text-xl font-bold text-[#003366]">Rate Product</h3>
              <p className="text-xs text-gray-400 font-medium mt-1">
                Your feedback helps the Bicol U community!
              </p>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-6">
              {/* Star Rating Section */}
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRatingValue(star)}
                    className="transition-transform active:scale-90"
                  >
                    <Star
                      size={32}
                      fill={star <= ratingValue ? "#FF851B" : "none"}
                      className={
                        star <= ratingValue ? "text-[#FF851B]" : "text-gray-200"
                      }
                      strokeWidth={star <= ratingValue ? 0 : 2}
                    />
                  </button>
                ))}
              </div>

              {/* Text Review */}
              <div>
                <label className="block text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2 ml-1">
                  Tell us more
                </label>
                <textarea
                  required
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="What did you like or dislike about the product/service?"
                  className="w-full bg-slate-50 border border-slate-100 rounded-3xl p-5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#FF851B]/20 transition-all min-h-[100px] resize-none"
                />
              </div>

              {/* Picture Upload Section */}
              <div>
                <label className="block text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2 ml-1">
                  Add a photo
                </label>
                <div className="flex flex-wrap gap-3">
                  {reviewImage ? (
                    <div className="relative group">
                      <img
                        src={reviewImage}
                        alt="Preview"
                        className="w-20 h-20 object-cover rounded-2xl border-2 border-[#FF851B]"
                      />
                      <button
                        type="button"
                        onClick={() => setReviewImage(null)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-md"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current.click()}
                      className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-[#FF851B] hover:text-[#FF851B] transition-all bg-slate-50"
                    >
                      <Plus size={20} />
                      <span className="text-[10px] font-bold mt-1">Upload</span>
                    </button>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-[#FF851B] text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#E67616] transition-all shadow-lg shadow-orange-100"
              >
                Submit Review
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="mb-8 font-sans">
        <h1 className="text-2xl font-bold text-[#003366]">My orders</h1>
        <p className="text-xs text-gray-400 font-medium mt-1">
          Track your campus purchases and services
        </p>
      </div>

      {/* --- FR-27: STATUS TABS --- */}
      <div className="bg-white border border-gray-100 rounded-2xl flex overflow-x-auto no-scrollbar shadow-sm mb-8 p-1.5 font-sans">
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
            className={`flex-1 px-4 py-3 text-[11px] font-bold rounded-xl transition-all whitespace-nowrap ${
              activeTab === tab
                ? "bg-[#FF851B] text-white shadow-md"
                : "text-gray-400 hover:bg-gray-50"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* --- ORDERS LIST --- */}
      <div className="space-y-6 font-sans">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[32px] border border-gray-100">
            <Package size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="font-bold text-gray-400 text-sm">
              No orders found in this category.
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => (
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
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    {order.id}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-black uppercase px-3 py-1 rounded-lg ${
                    order.status === "Completed"
                      ? "text-green-600 bg-green-50"
                      : order.status === "Cancelled"
                        ? "text-red-600 bg-red-50"
                        : "text-[#FF851B] bg-orange-50"
                  }`}
                >
                  {order.status}
                </span>
              </div>

              {/* Body */}
              <div className="p-8 flex flex-col md:flex-row gap-8">
                <div className="flex gap-6 flex-grow">
                  <img
                    src={order.items[0].img}
                    className="w-24 h-24 rounded-[20px] object-cover border border-gray-100 shadow-sm shrink-0"
                    alt="Product"
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

                {/* FR-27: Live Tracking Box */}
                <div className="md:w-64 bg-slate-50 rounded-3xl p-5 border border-slate-100 self-center">
                  <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2">
                    Live update
                  </p>
                  <p
                    className={`text-xs font-bold leading-relaxed italic ${order.status === "Cancelled" ? "text-red-500" : "text-[#003366]"}`}
                  >
                    {getLiveUpdateText(order.status)}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="px-8 py-5 bg-slate-50/20 border-t border-gray-50 flex flex-col sm:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Grand Total
                  </span>
                  <span className="text-2xl font-black text-[#FF851B]">
                    ₱{order.total.toLocaleString()}
                  </span>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  {/* FR-26: Cancel Button (Only if "To confirm") */}
                  {order.status === "To confirm" && (
                    <button
                      onClick={() => setCancelTarget(order.id)}
                      className="flex-grow px-6 py-3 border border-red-100 text-red-500 text-xs font-bold rounded-2xl hover:bg-red-50 transition-all"
                    >
                      Cancel order
                    </button>
                  )}

                  {/* FR-25: Confirm Receipt Button (Only if "To receive") */}
                  {order.status === "To receive" && (
                    <button
                      onClick={() => setConfirmTarget(order.id)}
                      className="flex-grow px-6 py-3 bg-green-600 text-white text-xs font-bold rounded-2xl hover:bg-green-700 transition-all shadow-md"
                    >
                      Confirm receipt
                    </button>
                  )}

                  {/* FR-15: Rate Button (Now launches the review popup) */}
                  {order.status === "Completed" && (
                    <button
                      onClick={() => setRatingTarget(order)}
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
          ))
        )}
      </div>

      {/* --- FR-26 MODAL: Cancel Order Confirmation --- */}
      {cancelTarget && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#003366]/40 backdrop-blur-sm"
            onClick={() => setCancelTarget(null)}
          ></div>
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-sm relative z-10 overflow-hidden animate-in zoom-in duration-200 font-sans">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={32} className="text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-[#003366] mb-2">
                Cancel Order?
              </h3>
              <p className="text-gray-500 text-xs mb-6 px-2">
                Are you sure you want to cancel order{" "}
                <span className="font-bold text-gray-800">{cancelTarget}</span>?
                This action cannot be undone.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleCancelOrder}
                  className="w-full bg-red-500 text-white py-3.5 rounded-xl font-bold text-xs hover:bg-red-600 transition-colors shadow-md"
                >
                  Yes, Cancel Order
                </button>
                <button
                  onClick={() => setCancelTarget(null)}
                  className="w-full bg-white border border-gray-200 text-gray-500 py-3.5 rounded-xl font-bold text-xs hover:bg-gray-50 transition-colors"
                >
                  Keep Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- FR-25 MODAL: Confirm Order Reception --- */}
      {confirmTarget && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 font-sans">
          <div
            className="absolute inset-0 bg-[#003366]/40 backdrop-blur-sm"
            onClick={() => setConfirmTarget(null)}
          ></div>
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-sm relative z-10 overflow-hidden animate-in zoom-in duration-200">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} className="text-green-500" />
              </div>
              <h3 className="text-lg font-bold text-[#003366] mb-2">
                Confirm Delivery
              </h3>
              <p className="text-gray-500 text-xs mb-6 px-2">
                By confirming, you agree that you have received order{" "}
                <span className="font-bold text-gray-800">{confirmTarget}</span>{" "}
                in good condition.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleConfirmReceipt}
                  className="w-full bg-[#FF851B] text-white py-3.5 rounded-xl font-bold text-xs hover:bg-[#E67616] transition-colors shadow-md"
                >
                  Confirm Order Received
                </button>
                <button
                  onClick={() => setConfirmTarget(null)}
                  className="w-full bg-white border border-gray-200 text-gray-500 py-3.5 rounded-xl font-bold text-xs hover:bg-gray-50 transition-colors"
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper component for small data labels
function Label({ icon, text }) {
  return (
    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
      <span className="text-gray-400">{icon}</span> {text}
    </div>
  );
}
