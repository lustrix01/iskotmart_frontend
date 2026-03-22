import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ChevronRight,
  MessageSquare,
  Heart,
  CheckCircle,
  Star,
  Wrench,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

export default function MerchantProfile() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("products");
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

  // Mock Merchant Data
  const merchant = {
    name: "TechHub Electronics",
    isVerified: true,
    bio: "Digital art, custom illustrations, and graphic design services. We specialize in cute and aesthetic branding for student orgs, thesis projects, and personal works.",
    rating: 4.9,
    reviews: 128,
    sold: "1.2k+",
    responseRate: "98%",
    responseTime: "Within 1hr",
    joined: "August 2024",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=250",
  };

  // Mock Products & Services Data
  const products = Array(8)
    .fill()
    .map((_, i) => ({
      id: `p${i + 1}`,
      name: "Wireless Gaming Mouse RGB",
      price: 999.0,
      oldPrice: 1200.0,
      rating: 4.8,
      img: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=300",
    }));

  const services = Array(4)
    .fill()
    .map((_, i) => ({
      id: `s${i + 1}`,
      name: "Custom Logo Design",
      price: 800.0,
      rateType: "per project",
      rating: 5.0,
      img: "https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=300",
    }));

  return (
    <div className="bg-[#F5F7F9] min-h-screen pb-12 font-sans animate-in fade-in duration-500">
      <div className="max-w-[1200px] mx-auto px-4 pt-6">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-4 font-medium">
          <Link to="/" className="hover:text-[#0074D9] transition-colors">
            Home
          </Link>
          <ChevronRight size={12} />
          <Link
            to="/products"
            className="hover:text-[#0074D9] transition-colors"
          >
            Shop products
          </Link>
          <ChevronRight size={12} />
          <span className="text-[#003366]">{merchant.name}</span>
        </div>

        {/* MERCHANT PROFILE CARD */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm mb-8 overflow-hidden">
          {/* Banner */}
          <div className="h-48 bg-gradient-to-r from-[#002244] to-[#003366] w-full relative">
            {/* Optional subtle pattern overlay could go here */}
          </div>

          {/* Profile Content Wrapper */}
          <div className="px-8 pb-8 relative">
            {/* Avatar & Buttons Row */}
            <div className="flex justify-between items-end -mt-16 mb-6">
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-4 border-white shadow-md overflow-hidden bg-gray-100">
                  <img
                    src={merchant.avatar}
                    alt={merchant.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() =>
                    handleAction(
                      "Opening Chat",
                      "Connecting to merchant's inbox...",
                      `Initializing socket_room with merchant_id=${id}`,
                    )
                  }
                  className="px-6 py-2.5 bg-white border border-[#0074D9] text-[#0074D9] text-xs font-bold rounded-lg hover:bg-blue-50 transition-all flex items-center gap-2"
                >
                  <MessageSquare size={16} />
                  Message
                </button>
                <button
                  onClick={() =>
                    handleAction(
                      "Merchant Followed",
                      "You will now receive updates from this shop.",
                      `Appending merchant_id=${id} to user_follows table`,
                    )
                  }
                  className="px-8 py-2.5 bg-[#FF851B] text-white text-xs font-bold rounded-lg hover:bg-[#E67616] shadow-sm shadow-orange-100 transition-all flex items-center gap-2"
                >
                  <Heart size={16} />
                  Follow
                </button>
              </div>
            </div>

            {/* Merchant Details */}
            <div className="max-w-2xl mb-8">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  {merchant.name}
                </h1>
                {merchant.isVerified && (
                  <ShieldCheck size={20} className="text-[#0074D9]" />
                )}
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                {merchant.bio}
              </p>
            </div>

            {/* Stats Row */}
            <div className="flex flex-wrap gap-10 border-t border-gray-100 pt-6">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Rating
                </p>
                <div className="flex items-center gap-1.5">
                  <div className="flex">
                    <Star size={14} fill="#FF851B" className="text-[#FF851B]" />
                    <Star size={14} fill="#FF851B" className="text-[#FF851B]" />
                    <Star size={14} fill="#FF851B" className="text-[#FF851B]" />
                    <Star size={14} fill="#FF851B" className="text-[#FF851B]" />
                    <Star size={14} fill="#FF851B" className="text-[#FF851B]" />
                  </div>
                  <span className="text-sm font-bold text-gray-900">
                    {merchant.rating}{" "}
                    <span className="text-xs text-gray-400 font-medium">
                      ({merchant.reviews})
                    </span>
                  </span>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Products sold
                </p>
                <p className="text-sm font-bold text-gray-900">
                  {merchant.sold}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Response rate
                </p>
                <p className="text-sm font-bold text-gray-900">
                  {merchant.responseRate}{" "}
                  <span className="text-xs text-gray-400 font-medium">
                    ({merchant.responseTime})
                  </span>
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Joined
                </p>
                <p className="text-sm font-bold text-gray-900">
                  {merchant.joined}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* TABS SECTION */}
        <div className="flex gap-8 border-b border-gray-200 mb-6 px-2">
          <button
            onClick={() => setActiveTab("products")}
            className={`pb-3 text-sm font-bold transition-colors relative ${activeTab === "products" ? "text-[#FF851B]" : "text-gray-500 hover:text-gray-800"}`}
          >
            Products{" "}
            <span className="text-xs opacity-60 font-medium">
              ({products.length})
            </span>
            {activeTab === "products" && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#FF851B] rounded-t-full"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab("services")}
            className={`pb-3 text-sm font-bold transition-colors relative ${activeTab === "services" ? "text-[#FF851B]" : "text-gray-500 hover:text-gray-800"}`}
          >
            Services{" "}
            <span className="text-xs opacity-60 font-medium">
              ({services.length})
            </span>
            {activeTab === "services" && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#FF851B] rounded-t-full"></div>
            )}
          </button>
        </div>

        {/* GRID CONTENT */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {activeTab === "products"
            ? products.map((item) => (
                <Link
                  to={`/product/${item.id}`}
                  key={item.id}
                  className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-xl hover:border-[#FF851B]/30 transition-all duration-300 group flex flex-col"
                >
                  <div className="aspect-square bg-gray-50 relative overflow-hidden">
                    <img
                      src={item.img}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-4 flex flex-col flex-grow">
                    <h3 className="text-[11px] font-medium text-gray-700 leading-tight mb-2 line-clamp-2 group-hover:text-[#003366] transition-colors">
                      {item.name}
                    </h3>
                    <div className="mt-auto">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-sm font-bold text-[#FF851B]">
                          ₱{item.price.toFixed(2)}
                        </span>
                        <span className="text-[9px] text-gray-400 line-through">
                          ₱{item.oldPrice.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-yellow-400 text-[10px]">
                        ★★★★★{" "}
                        <span className="text-gray-400 font-medium ml-0.5">
                          ({item.rating})
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            : services.map((item) => (
                <Link
                  to={`/service/${item.id}`}
                  key={item.id}
                  className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-xl hover:border-[#0074D9]/30 transition-all duration-300 group flex flex-col"
                >
                  <div className="aspect-square bg-gray-50 relative overflow-hidden">
                    <img
                      src={item.img}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm p-1.5 rounded-md shadow-sm">
                      <Wrench size={14} className="text-[#0074D9]" />
                    </div>
                  </div>
                  <div className="p-4 flex flex-col flex-grow">
                    <h3 className="text-[11px] font-medium text-gray-700 leading-tight mb-2 line-clamp-2 group-hover:text-[#003366] transition-colors">
                      {item.name}
                    </h3>
                    <div className="mt-auto">
                      <div className="flex items-end gap-1 mb-1">
                        <span className="text-sm font-bold text-[#0074D9]">
                          ₱{item.price.toFixed(2)}
                        </span>
                        <span className="text-[9px] text-gray-400 mb-0.5">
                          {item.rateType}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-yellow-400 text-[10px]">
                        ★★★★★{" "}
                        <span className="text-gray-400 font-medium ml-0.5">
                          ({item.rating})
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
        </div>
      </div>

      {/* --- SIMULATION POPUP --- */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#003366]/40 backdrop-blur-md animate-in fade-in"
            onClick={closeModal}
          ></div>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm relative z-10 overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={32} className="text-[#0074D9]" />
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
                <p className="text-[10px] font-medium text-[#003366]">
                  {modal.action}
                </p>
              </div>

              <button
                onClick={closeModal}
                className="w-full bg-[#003366] text-white py-3.5 rounded-xl font-bold text-xs shadow-md hover:bg-[#002244] transition-all"
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
