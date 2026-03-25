import React, { useState } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import {
  Star,
  MessageCircle,
  Store,
  ChevronRight,
  Heart,
  Minus,
  Plus,
  ShoppingCart,
  Truck,
  ShieldCheck,
  ThumbsUp,
  MoreVertical,
  ChevronLeft,
  MapPin,
  Package,
  Calendar,
  CheckCircle2,
  X,
  ShoppingBag,
  Info,
  CreditCard,
  Handshake,
  ListChecks,
} from "lucide-react";

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Automatically detect if we are on the /service/ route or /product/ route
  const isService = location.pathname.includes("/service");

  // --- STATE FOR FUNCTIONS ---
  const [quantity, setQuantity] = useState(1);
  const [selectedImg, setSelectedImg] = useState(0);
  const [activeFilter, setActiveFilter] = useState("All (64)");
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [notification, setNotification] = useState(null);

  // --- DYNAMIC DATA SIMULATION ---
  // If the URL has "/product/", it loads this:
  const productData = {
    type: "product",
    name: "Limited Edition Bicol University Canvas Tote Bag",
    brand: "IskoMart Originals",
    price: 999.0,
    oldPrice: 1200.0,
    rating: 5.0,
    ratingsCount: 64,
    stock: 240,
    soldCount: 152,
    location: "BU Main Campus, Legazpi City",
    specifications: [
      { label: "Material", value: "Premium Heavy Canvas" },
      { label: "Dimensions", value: "14 x 16 inches" },
      { label: "Design", value: "Heat-pressed BU Pillar Logo" },
      { label: "Pocket", value: "Internal Phone Sleeve included" },
    ],
    paymentOptions: ["GCash", "Cash on Delivery", "Bank Transfer"],
    deliveryOptions: ["Standard Local (₱40.00)", "Campus Meetup (Free)"],
    merchant: {
      name: "CANDL& Student Ventures",
      avatar: "https://i.pravatar.cc/150?u=candl",
      lastActive: "Active 12 minutes ago",
      ratings: "1.2k",
      products: "24",
      responseRate: "100%",
      joined: "2 years ago",
    },
    images: [
      "https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=800", // Tote bag 1
      "https://images.unsplash.com/photo-1591561954557-26941169b49e?q=80&w=800", // Tote bag 2
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800", // Tote bag 3
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800", // Tote bag 4
    ],
  };

  // If the URL has "/service/", it loads this instead:
  const serviceData = {
    type: "service",
    name: "Premium Custom Logo Design & Branding",
    brand: "Creative BUenos",
    price: 1500.0,
    oldPrice: 2000.0,
    rating: 4.9,
    ratingsCount: 28,
    stock: 5, // Representing available slots
    soldCount: 45,
    location: "Online / Remote",
    milestones: [
      {
        step: 1,
        title: "Initial Consultation",
        desc: "Discuss project scope, colors, and requirements via IskoChat.",
      },
      {
        step: 2,
        title: "Drafting & Review",
        desc: "First 3 logo concepts submitted for your approval within 3 days.",
      },
      {
        step: 3,
        title: "Final Revisions",
        desc: "Up to 2 major revisions based on your feedback to perfect the design.",
      },
      {
        step: 4,
        title: "Handover",
        desc: "Final high-resolution files (PNG, SVG, AI) delivered via Google Drive.",
      },
    ],
    paymentOptions: ["GCash", "Bank Transfer"],
    deliveryOptions: [
      "Digital Delivery (Free)",
      "Face-to-Face Consultation (BU Campus)",
    ],
    merchant: {
      name: "Creative BUenos Design",
      avatar: "https://i.pravatar.cc/150?u=design",
      lastActive: "Active just now",
      ratings: "450",
      products: "8", // Representing service packages
      responseRate: "98%",
      joined: "1 year ago",
    },
    images: [
      "https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=800", // Graphic design 1
      "https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=800", // Graphic design 2
      "https://images.unsplash.com/photo-1558655146-d09347e92766?q=80&w=800", // Logo sketches
      "https://images.unsplash.com/photo-1513530534585-c7b1394c6d51?q=80&w=800", // Creative workspace
    ],
  };

  // Assign the active data based on the URL
  const itemData = isService ? serviceData : productData;

  // --- FUNCTION HANDLERS ---
  const triggerToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAddToCart = () => {
    setCartCount((prev) => prev + quantity);
    triggerToast(
      `${quantity} ${isService ? "slot(s)" : "item(s)"} added to cart!`,
    );
  };

  const handleBuyNow = () => {
    navigate(`/checkout?type=${itemData.type}`, {
      state: { product: itemData, quantity },
    });
  };

  return (
    <div className="bg-[#F5F7F9] min-h-screen pb-20 font-sans relative">
      {/* Toast Notification Simulation */}
      {notification && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[100] bg-[#003366] text-white px-6 py-3 rounded-md shadow-xl text-xs font-bold animate-in fade-in slide-in-from-top-4">
          {notification}
        </div>
      )}

      {/* --- CART BUBBLE --- */}
      <div className="fixed bottom-10 right-10 z-50">
        <button
          onClick={() => navigate("/cart")}
          className="bg-[#003366] text-white p-5 rounded-full shadow-2xl hover:scale-110 transition-transform relative group"
        >
          <ShoppingBag size={24} />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-[#FF851B] text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-white animate-bounce">
              {cartCount}
            </span>
          )}
        </button>
      </div>

      {/* 1. BREADCRUMBS */}
      <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center gap-2 text-[11px] text-gray-400 font-bold tracking-wider">
        <Link to="/" className="hover:text-[#003366] transition-colors">
          Home
        </Link>
        <ChevronRight size={12} />
        <Link to="/" className="hover:text-[#003366] transition-colors">
          {isService ? "Services" : "Shop Products"}
        </Link>
        <ChevronRight size={12} />
        <span className="text-[#003366] truncate max-w-xs">
          {itemData.name}
        </span>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 space-y-6">
        {/* 2. MAIN PRODUCT SECTION */}
        <div className="bg-white rounded-sm shadow-sm p-8 grid grid-cols-1 md:grid-cols-12 gap-12">
          {/* Left: Image Gallery */}
          <div className="md:col-span-5 space-y-4">
            <div className="aspect-square bg-gray-50 rounded-md overflow-hidden border border-gray-100 relative group cursor-zoom-in">
              <img
                src={itemData.images[selectedImg]}
                alt="Main"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <button
                onClick={() =>
                  setSelectedImg((prev) =>
                    prev > 0 ? prev - 1 : itemData.images.length - 1,
                  )
                }
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-[#003366] p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() =>
                  setSelectedImg((prev) =>
                    prev < itemData.images.length - 1 ? prev + 1 : 0,
                  )
                }
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-[#003366] p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronRight size={20} />
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto no-scrollbar">
              {itemData.images.map((img, idx) => (
                <button
                  key={idx}
                  onMouseEnter={() => setSelectedImg(idx)}
                  className={`w-20 h-20 rounded-md border-2 transition-all overflow-hidden bg-white shrink-0 ${
                    selectedImg === idx
                      ? "border-[#FF851B] scale-105 shadow-md"
                      : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <img
                    src={img}
                    className="w-full h-full object-cover"
                    alt="Thumb"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Right: Info Section */}
          <div className="md:col-span-7 flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-[#0074D9] text-white text-[9px] font-black px-2 py-0.5 rounded-sm tracking-tighter italic">
                IskoMart Choice
              </span>
              <span className="text-gray-400 text-xs font-semibold">
                SKU: BU-{isService ? "SRV" : "PRD"}-2026
              </span>
            </div>

            <h1 className="text-2xl font-black text-gray-800 mb-2 leading-tight italic tracking-tight">
              {itemData.name}
            </h1>

            <div className="flex items-center gap-4 mb-6 text-sm">
              <div className="flex items-center text-[#FF851B] font-bold border-r border-gray-200 pr-4">
                <span className="mr-1 underline decoration-2 underline-offset-4 tracking-tighter text-lg">
                  {itemData.rating.toFixed(1)}
                </span>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} fill="#FF851B" stroke="none" />
                  ))}
                </div>
              </div>
              <div className="text-gray-400 border-r border-gray-200 pr-4 font-semibold text-[10px] tracking-widest">
                <span className="text-gray-800 text-sm border-b-2 border-[#FF851B]">
                  {itemData.ratingsCount}
                </span>{" "}
                Ratings
              </div>
              <div className="text-gray-400 font-semibold text-[10px] tracking-widest">
                <span className="text-gray-800 text-sm">
                  {itemData.soldCount}
                </span>{" "}
                {isService ? "Booked" : "Sold"}
              </div>
            </div>

            <div className="bg-[#F8F9FA] p-6 rounded-md mb-6 flex items-baseline gap-3">
              <span className="text-4xl font-black text-[#FF851B] tracking-tighter">
                ₱
                {itemData.price.toLocaleString(undefined, {
                  minimumFractionDigits: 1,
                })}
              </span>
              <span className="text-gray-400 line-through text-sm font-bold">
                ₱{itemData.oldPrice.toFixed(1)}
              </span>
              <span className="bg-[#FF851B]/10 text-[#FF851B] text-[10px] font-black px-1.5 py-0.5 rounded-sm">
                17% Off
              </span>
            </div>

            {/* Payment & Delivery Quick Info */}
            <div className="flex flex-wrap gap-4 mb-8">
              <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded border border-green-100 text-green-700">
                <ShieldCheck size={14} />
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  Verified Merchant
                </span>
              </div>
              <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded border border-blue-100 text-[#0074D9]">
                <CreditCard size={14} />
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  Accepts GCash
                </span>
              </div>
            </div>

            {/* Detail Fields (Dynamically adapted) */}
            <div className="space-y-6 text-[13px] text-gray-600">
              <div className="grid grid-cols-4">
                <span className="text-gray-400 font-bold text-[10px] tracking-wider pt-1 uppercase">
                  {isService ? "Service Setup" : "Shipping"}
                </span>
                <div className="col-span-3 space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-[#0074D9]" />
                    <span className="font-semibold text-gray-700">
                      {isService ? "Available at:" : "Shipping from:"}{" "}
                      <span className="text-gray-500 font-normal">
                        {itemData.location}
                      </span>
                    </span>
                  </div>

                  {itemData.deliveryOptions.map((option, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      {option.includes("Meetup") || option.includes("Face") ? (
                        <Handshake size={16} className="text-[#0074D9]" />
                      ) : (
                        <Truck size={16} className="text-[#0074D9]" />
                      )}
                      <span className="font-semibold text-gray-700">
                        Option {idx + 1}:{" "}
                        <span className="text-gray-500 font-normal">
                          {option}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-4 items-center">
                <span className="text-gray-400 font-bold text-[10px] tracking-wider uppercase">
                  {isService ? "Slots" : "Quantity"}
                </span>
                <div className="col-span-3 flex items-center gap-5">
                  <div className="flex items-center border border-gray-200 rounded-sm overflow-hidden bg-white shadow-sm">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-4 py-2 hover:bg-gray-50 text-gray-500 transition-colors border-r border-gray-100"
                    >
                      <Minus size={14} strokeWidth={3} />
                    </button>
                    <span className="px-6 font-black text-[#003366] text-base min-w-[50px] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() =>
                        setQuantity(Math.min(itemData.stock, quantity + 1))
                      }
                      className="px-4 py-2 hover:bg-gray-50 text-gray-500 transition-colors border-l border-gray-100"
                    >
                      <Plus size={14} strokeWidth={3} />
                    </button>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-400 text-[10px] font-black tracking-tighter italic">
                      {isService ? "Available Capacity" : "Remaining stock"}
                    </span>
                    <span className="text-gray-600 text-xs font-bold">
                      {isService
                        ? `${itemData.stock} slots available`
                        : `${itemData.stock} pieces left`}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-auto pt-12 flex items-center gap-4">
              <button
                onClick={handleAddToCart}
                className="flex-[2] group border-2 border-[#FF851B] text-[#FF851B] py-4 rounded-md font-black text-xs flex items-center justify-center gap-3 hover:bg-[#FF851B] hover:text-white transition-all duration-300 shadow-md"
              >
                {isService ? (
                  <Calendar
                    size={20}
                    className="transition-transform group-hover:-translate-y-1"
                    strokeWidth={2.5}
                  />
                ) : (
                  <ShoppingCart
                    size={20}
                    className="transition-transform group-hover:-translate-y-1"
                    strokeWidth={2.5}
                  />
                )}
                {isService ? "Add to bookings" : "Add to cart"}
              </button>
              <button
                onClick={handleBuyNow}
                className="flex-[3] bg-[#FF851B] text-white py-4 rounded-md font-black text-xs hover:bg-[#E67616] transition-all duration-300 shadow-xl shadow-[#FF851B]/20 transform hover:-translate-y-1 active:scale-95"
              >
                {isService ? "Book now" : "Buy now"}
              </button>
              <button
                onClick={() => {
                  setIsWishlisted(!isWishlisted);
                  triggerToast(
                    isWishlisted
                      ? "Removed from wishlist"
                      : "Added to wishlist",
                  );
                }}
                className={`flex flex-col items-center gap-1 transition-all px-4 group ${isWishlisted ? "text-red-500" : "text-gray-400 hover:text-red-500"}`}
              >
                <Heart
                  size={24}
                  className={`group-hover:scale-125 transition-transform ${isWishlisted ? "fill-current" : ""}`}
                />
                <span className="text-[9px] font-black tracking-widest italic">
                  Wishlist
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* 3. MERCHANT SECTION */}
        <div className="bg-white rounded-sm shadow-sm p-8 flex flex-col md:flex-row items-center gap-10">
          <div className="flex items-center gap-6 md:border-r md:pr-12 border-gray-100 shrink-0">
            <div className="relative">
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden border-4 border-[#003366]/5 p-0.5">
                <img
                  src={itemData.merchant.avatar}
                  alt="avatar"
                  className="rounded-full h-full w-full object-cover"
                />
              </div>
              <CheckCircle2
                size={24}
                className="absolute bottom-0 right-0 text-[#0074D9] bg-white rounded-full"
              />
            </div>
            <div className="space-y-1">
              <h3 className="font-black text-[#003366] text-lg italic tracking-tight leading-none">
                {itemData.merchant.name}
              </h3>
              <p className="text-[10px] text-green-500 font-black flex items-center gap-1.5 italic">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                {itemData.merchant.lastActive}
              </p>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => triggerToast("Opening IskoChat...")}
                  className="flex items-center gap-2 text-[10px] font-black bg-[#FF851B]/10 text-[#FF851B] px-4 py-2 border border-[#FF851B]/20 hover:bg-[#FF851B] hover:text-white transition-all rounded-sm"
                >
                  <MessageCircle size={14} /> Chat now
                </button>
                <button
                  onClick={() => navigate(`/merchant/${id}`)}
                  className="flex items-center gap-2 text-[10px] font-black border-2 border-gray-100 text-gray-500 px-4 py-2 hover:border-[#003366] hover:text-[#003366] transition-all rounded-sm"
                >
                  <Store size={14} /> View shop
                </button>
              </div>
            </div>
          </div>
          <div className="flex-grow grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: "Ratings", val: itemData.merchant.ratings, icon: Star },
              {
                label: isService ? "Packages" : "Products",
                val: itemData.merchant.products,
                icon: Package,
              },
              {
                label: "Response rate",
                val: itemData.merchant.responseRate,
                icon: MessageCircle,
              },
              {
                label: "Joined",
                val: itemData.merchant.joined,
                icon: Calendar,
              },
            ].map((stat, i) => (
              <div key={i} className="flex items-start gap-3">
                <stat.icon size={16} className="text-gray-300 mt-1" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-400 font-black tracking-tighter italic">
                    {stat.label}
                  </span>
                  <span className="text-[#FF851B] font-black text-sm">
                    {stat.val}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. DYNAMIC SPECIFICATIONS / MILESTONES */}
        <div className="bg-white rounded-sm shadow-sm p-8">
          <h2 className="text-sm font-black text-[#003366] tracking-widest mb-6 italic border-b pb-4 border-gray-50 flex items-center gap-2">
            {isService ? (
              <ListChecks size={18} className="text-[#FF851B]" />
            ) : (
              <Info size={18} className="text-[#FF851B]" />
            )}
            {isService ? "Service Milestones" : "Product Specifications"}
          </h2>

          {isService ? (
            /* SERVICE VIEW: Timeline / Milestones */
            <div className="space-y-6">
              {itemData.milestones.map((m, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-[#0074D9]/10 text-[#0074D9] flex items-center justify-center font-black text-xs border border-[#0074D9]/20">
                      {m.step}
                    </div>
                    {i !== itemData.milestones.length - 1 && (
                      <div className="w-px h-full bg-gray-100 my-2"></div>
                    )}
                  </div>
                  <div className="pb-4">
                    <h4 className="text-sm font-bold text-gray-800">
                      {m.title}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      {m.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* PRODUCT VIEW: Grid Specifications */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-20">
              {itemData.specifications.map((spec, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-sm py-1 border-b border-gray-50"
                >
                  <span className="text-gray-400 font-bold text-[10px] tracking-wider uppercase">
                    {spec.label}
                  </span>
                  <span className="text-gray-700 font-semibold">
                    {spec.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 5. RATINGS & REVIEWS SECTION */}
        <div className="bg-white rounded-sm shadow-sm p-8">
          <div className="flex justify-between items-center mb-8 border-b pb-4 border-gray-50">
            <h2 className="text-sm font-black text-[#003366] tracking-widest italic">
              {isService ? "Service Reviews" : "Product Ratings"}
            </h2>
            <button className="text-[10px] font-black text-[#0074D9] hover:underline">
              Guidelines
            </button>
          </div>

          <div className="bg-gray-50/80 border border-[#003366]/5 p-10 rounded-md mb-8 flex flex-col lg:flex-row items-center gap-12">
            <div className="text-center border-gray-200 lg:border-r lg:pr-16">
              <p className="text-5xl font-black text-[#FF851B] tracking-tighter">
                {itemData.rating.toFixed(1)}{" "}
                <span className="text-xl text-gray-300 font-medium">/ 5</span>
              </p>
              <div className="flex gap-1 justify-center mt-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={24} fill="#FF851B" stroke="none" />
                ))}
              </div>
              <p className="text-gray-400 text-[10px] font-black mt-4 tracking-widest italic">
                Based on {itemData.ratingsCount} reviews
              </p>
            </div>

            <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
              {[
                `All (${itemData.ratingsCount})`,
                `5 Star (${itemData.ratingsCount})`,
                "4 Star (0)",
                "3 Star (0)",
                "2 Star (0)",
                "1 Star (0)",
                "With images/videos (10)",
                "With comments (42)",
                "Great quality (50)",
              ].map((filter, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-5 py-2.5 rounded-sm border-2 text-[10px] font-black transition-all tracking-wider ${
                    activeFilter === filter
                      ? "bg-white border-[#FF851B] text-[#FF851B] shadow-lg shadow-orange-100 ring-2 ring-[#FF851B]/10"
                      : "bg-white border-gray-100 text-gray-400 hover:border-gray-300"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-gray-50">
            {[1, 2, 3].map((review) => (
              <div
                key={review}
                className="py-10 flex gap-6 hover:bg-gray-50/30 transition-colors px-4 rounded-lg"
              >
                <div className="w-12 h-12 bg-gray-200 rounded-full shrink-0 overflow-hidden border-2 border-white shadow-sm">
                  <img src="https://via.placeholder.com/50" alt="user" />
                </div>
                <div className="space-y-3 flex-grow">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-black text-gray-800 tracking-tight">
                          Jose Rizal {review}
                        </p>
                        <span className="bg-green-100 text-green-600 text-[8px] font-black px-1.5 py-0.5 rounded-full tracking-tighter">
                          Verified student
                        </span>
                      </div>
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            fill="#FF851B"
                            stroke="none"
                          />
                        ))}
                      </div>
                    </div>
                    <button className="text-gray-300 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full">
                      <MoreVertical size={18} />
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-400 font-bold tracking-widest italic">
                    2026-03-21 14:02 |{" "}
                    {isService
                      ? "Service completed on time"
                      : "Variation: Large - Navy Blue"}
                  </p>

                  <div className="flex gap-2">
                    <span className="text-[8px] font-black border-2 border-green-500/20 px-2 py-0.5 text-green-600 rounded-full bg-green-50 shadow-sm">
                      {isService ? "Highly Recommended" : "Great quality"}
                    </span>
                    <span className="text-[8px] font-black border-2 border-orange-500/20 px-2 py-0.5 text-orange-600 rounded-full bg-orange-50 shadow-sm">
                      {isService ? "Very professional" : "Will repurchase"}
                    </span>
                  </div>

                  <p className="text-[14px] text-gray-600 leading-relaxed max-w-4xl py-2 font-medium">
                    {isService
                      ? "The seller was very accommodating and professional throughout the entire process. Communication was smooth and the output was delivered on time. Definitely booking again!"
                      : "The quality is beyond my expectations! The canvas is thick and the print is durable. Perfect for Bicol University students who need to carry a lot of books. Fast shipping to Daraga campus!"}
                  </p>

                  <div className="flex gap-3 pt-3 overflow-x-auto">
                    {itemData.images.slice(0, 3).map((img, i) => (
                      <div
                        key={i}
                        className="w-24 h-24 bg-gray-50 border-2 border-white rounded-md shadow-sm overflow-hidden cursor-pointer hover:opacity-80 transition-all hover:scale-105"
                      >
                        <img
                          src={img}
                          className="w-full h-full object-cover"
                          alt="review-img"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-6 pt-6">
                    <button
                      onClick={() => triggerToast("Review marked as helpful!")}
                      className="flex items-center gap-2 text-gray-400 hover:text-[#0074D9] transition-colors group"
                    >
                      <ThumbsUp
                        size={16}
                        className="group-hover:-rotate-12 transition-transform"
                      />
                      <span className="text-[10px] font-black tracking-widest italic">
                        Helpful? (12)
                      </span>
                    </button>
                    <button
                      onClick={() => triggerToast("Reported for moderation.")}
                      className="text-gray-300 text-[10px] font-black tracking-widest hover:text-red-400 transition-colors italic"
                    >
                      Report
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 flex justify-center">
            <button className="px-10 py-3 border-2 border-gray-100 text-gray-400 text-[10px] font-black tracking-[0.3em] hover:border-[#FF851B] hover:text-[#FF851B] transition-all rounded-md italic">
              Load more reviews
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
