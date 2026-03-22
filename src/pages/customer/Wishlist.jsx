import React, { useState } from "react";
import {
  Heart,
  ShoppingCart,
  Trash2,
  Wrench,
  ShoppingBag,
  Star,
  Bell,
  Info,
  ChevronRight,
  Zap,
  Clock,
  Store,
} from "lucide-react";

export default function Wishlist() {
  const [modal, setModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    action: "",
  });

  const handleAction = (title, message, action) => {
    setModal({ isOpen: true, title, message, action });
  };

  const closeModal = () => setModal({ ...modal, isOpen: false });

  const mockWishlist = [
    {
      id: "WSH-101",
      merchant: "TechHub Electronics",
      type: "product",
      name: "Wireless Gaming Mouse",
      price: 1200,
      img: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=200",
      rating: 4.8,
      stock: "In stock",
      shipping: "Standard delivery",
    },
    {
      id: "WSH-102",
      merchant: "Elite Graphics",
      type: "service",
      name: "Custom Vector Illustration",
      price: 800,
      img: "https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=200",
      rating: 5.0,
      stock: "Available",
      shipping: "Online / Remote",
    },
    {
      id: "WSH-103",
      merchant: "Dorm Essentials",
      type: "product",
      name: "Compact Desk Lamp",
      price: 450,
      img: "https://images.unsplash.com/photo-1534073828943-f801091bb18c?q=80&w=200",
      rating: 4.5,
      stock: "Low stock (2 left)",
      shipping: "Meetup",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-500">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#003366]">My wishlist</h1>
        <p className="text-xs text-gray-400 mt-1">
          Products and services you've saved for later
        </p>
      </div>

      <div className="space-y-4">
        {mockWishlist.map((item) => (
          <div
            key={item.id}
            className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden transition-all hover:shadow-md hover:border-gray-200"
          >
            <div className="p-6 flex flex-col md:flex-row gap-8">
              {/* Product/Service Image */}
              <div className="relative shrink-0">
                <div className="w-24 h-24 rounded-lg border border-gray-100 overflow-hidden bg-gray-50 shadow-sm">
                  <img
                    src={item.img}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -top-2 -left-2 bg-white shadow-md rounded-full p-1.5 border border-gray-100">
                  {item.type === "service" ? (
                    <Wrench size={12} className="text-[#0074D9]" />
                  ) : (
                    <ShoppingBag size={12} className="text-[#FF851B]" />
                  )}
                </div>
              </div>

              {/* Main Content */}
              <div className="flex-grow min-w-0 flex flex-col justify-center">
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-2">
                    <Store size={14} className="text-gray-300" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      {item.merchant}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[#FF851B]">
                    <Star size={12} fill="#FF851B" />
                    <span className="text-xs font-bold">{item.rating}</span>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-gray-800 mb-2 truncate">
                  {item.name}
                </h3>

                <div className="flex gap-4">
                  <span className="text-xl font-bold text-[#FF851B]">
                    ₱{item.price.toLocaleString()}
                  </span>
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-medium">
                    <Clock size={12} />
                    <span>{item.shipping}</span>
                  </div>
                </div>
              </div>

              {/* Availability Sidebar */}
              <div className="md:w-64 bg-[#F8FAFC] rounded-lg p-4 flex flex-col justify-center border border-gray-50">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[#003366]">
                    <Zap size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                      Availability
                    </span>
                  </div>
                  <p
                    className={`text-[11px] font-bold ${item.stock.includes("Low") ? "text-red-500" : "text-green-600"}`}
                  >
                    {item.stock}
                  </p>
                  <p className="text-[10px] text-gray-400 leading-relaxed italic">
                    Added on March 20, 2026
                  </p>
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="px-6 py-4 bg-gray-50/10 border-t border-gray-50 flex justify-between items-center">
              <button
                onClick={() =>
                  handleAction(
                    "Remove Item",
                    "The item is being removed from your favorites.",
                    "Deleting record from wishlist_table where user_id = current_session",
                  )
                }
                className="flex items-center gap-2 text-[11px] font-bold text-gray-300 hover:text-red-500 transition-colors"
              >
                <Trash2 size={14} />
                Remove from wishlist
              </button>

              <div className="flex gap-3">
                <button
                  onClick={() =>
                    handleAction(
                      "View Details",
                      "Loading full item description...",
                      "Fetching complete metadata for " + item.id,
                    )
                  }
                  className="px-6 py-2 border border-gray-200 text-[#003366] text-xs font-bold rounded-md hover:bg-gray-50 transition-colors"
                >
                  View details
                </button>
                <button
                  onClick={() =>
                    handleAction(
                      item.type === "service" ? "Booking" : "Cart Update",
                      "Processing your request...",
                      item.type === "service"
                        ? "Redirecting to booking scheduler for service " +
                            item.id
                        : "Appending item to session_cart and updating local_storage",
                    )
                  }
                  className="px-6 py-2 bg-[#FF851B] text-white text-xs font-bold rounded-md hover:bg-[#E67616] transition-all flex items-center gap-2 shadow-sm active:scale-95"
                >
                  {item.type === "service" ? (
                    <Zap size={14} />
                  ) : (
                    <ShoppingCart size={14} />
                  )}
                  {item.type === "service" ? "Book now" : "Add to cart"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* --- CUSTOM POPUP MODAL --- */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#003366]/20 backdrop-blur-sm animate-in fade-in"
            onClick={closeModal}
          ></div>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm relative z-10 overflow-hidden animate-in zoom-in duration-300 border border-gray-100">
            <div className="p-8 text-center">
              <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Info size={28} className="text-[#0074D9]" />
              </div>
              <h3 className="text-lg font-bold text-[#003366] mb-1">
                {modal.title}
              </h3>
              <p className="text-gray-400 text-[11px] mb-6 leading-relaxed">
                {modal.message}
              </p>

              <div className="bg-[#F8FAFC] rounded-xl p-4 mb-6 border border-gray-100 text-left">
                <div className="flex items-center gap-2 mb-1.5 opacity-40 text-[#003366]">
                  <span className="text-[9px] font-bold tracking-widest uppercase">
                    Action taken
                  </span>
                </div>
                <p className="text-[10px] font-medium text-[#003366] leading-relaxed">
                  {modal.action}
                </p>
              </div>

              <button
                onClick={closeModal}
                className="w-full bg-[#003366] text-white py-3.5 rounded-xl font-bold text-xs shadow-md hover:bg-[#002244] transition-all active:scale-95"
              >
                Continue
              </button>
            </div>
            <div className="h-1 bg-gradient-to-r from-[#0074D9] to-[#FF851B] w-full"></div>
          </div>
        </div>
      )}
    </div>
  );
}
