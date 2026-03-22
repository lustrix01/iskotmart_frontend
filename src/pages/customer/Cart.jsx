import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom"; // Import useNavigate
import {
  Trash2,
  Minus,
  Plus,
  ChevronRight,
  ShoppingBag,
  Wrench,
  Ticket,
  ShieldCheck,
} from "lucide-react";

export default function Cart() {
  const [activeTab, setActiveTab] = useState("product");
  const navigate = useNavigate(); // Initialize navigation

  // Function to handle navigation to checkout
  const handleCheckout = () => {
    navigate(`/checkout?type=${activeTab}`);
  };

  return (
    <div className="bg-[#F5F7F9] min-h-screen font-sans">
      <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center gap-2 text-[10px] text-gray-400 font-bold tracking-widest">
        <Link to="/" className="hover:text-[#003366] transition-colors italic">
          Home
        </Link>
        <ChevronRight size={10} />
        <span className="text-[#003366] italic">Shopping Cart</span>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 pb-20">
        <div className="bg-white rounded-t-md shadow-sm flex mb-8 overflow-hidden p-1 border border-gray-100">
          <button
            onClick={() => setActiveTab("product")}
            className={`flex-1 py-3 flex items-center justify-center gap-3 transition-all rounded-sm ${activeTab === "product" ? "bg-[#003366] text-white shadow-md" : "text-gray-400 hover:bg-gray-50"}`}
          >
            <ShoppingBag size={18} />
            <span className="font-bold text-[11px] tracking-wider">
              Product Cart (5)
            </span>
          </button>
          <button
            onClick={() => setActiveTab("service")}
            className={`flex-1 py-3 flex items-center justify-center gap-3 transition-all rounded-sm ${activeTab === "service" ? "bg-[#003366] text-white shadow-md" : "text-gray-400 hover:bg-gray-50"}`}
          >
            <Wrench size={18} />
            <span className="font-bold text-[11px] tracking-wider">
              Service Cart (2)
            </span>
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start relative">
          <div className="flex-grow w-full space-y-6">
            {activeTab === "product" ? (
              <ProductCartItems />
            ) : (
              <ServiceCartItems />
            )}
          </div>

          {/* ASIDE: This is now sticky and won't scroll with the list */}
          <aside className="w-full lg:w-[400px] lg:sticky lg:top-24">
            <CartSummary type={activeTab} onCheckout={handleCheckout} />

            <div className="mt-6 bg-[#F8FAFC] p-4 rounded-md flex items-center gap-4 border border-gray-100">
              <ShieldCheck className="text-[#003366] shrink-0" size={20} />
              <p className="text-[9px] text-[#003366] font-bold leading-relaxed italic opacity-60">
                IskoMart Guarantee: Your payments are secure and held until
                order completion.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

// Sub-components for clean code
function ProductCartItems() {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-sm shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gray-50/50 px-6 py-3 border-b border-gray-100 flex items-center gap-3">
          <div className="w-6 h-6 bg-[#003366] rounded-full flex items-center justify-center text-[8px] text-white font-bold">
            TH
          </div>
          <h3 className="font-bold text-[#003366] text-[10px] tracking-widest">
            TechHub Electronics
          </h3>
        </div>
        {[1, 2].map((i) => (
          <div
            key={i}
            className="p-6 flex gap-6 border-b border-gray-50 last:border-0"
          >
            <div className="w-24 h-24 bg-gray-100 rounded-md overflow-hidden shrink-0 border border-gray-100">
              <img
                src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=200"
                className="w-full h-full object-cover"
                alt="item"
              />
            </div>
            <div className="flex-grow flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="space-y-0.5">
                  <h4 className="font-bold text-gray-800 text-xs tracking-tight">
                    Product Name: Description
                  </h4>
                  <p className="text-[9px] text-gray-400 font-semibold">
                    Variation: Space Gray
                  </p>
                </div>
                <span className="font-bold text-[#FF851B] text-base">
                  ₱999.0
                </span>
              </div>
              <div className="flex justify-between items-center mt-4">
                <div className="flex items-center border border-gray-200 rounded-sm bg-white overflow-hidden shadow-sm">
                  <button className="px-3 py-1 hover:bg-gray-50 text-gray-400 border-r border-gray-100">
                    <Minus size={12} />
                  </button>
                  <span className="px-4 font-bold text-[#003366] text-xs">
                    1
                  </span>
                  <button className="px-3 py-1 hover:bg-gray-50 text-gray-400 border-l border-gray-100">
                    <Plus size={12} />
                  </button>
                </div>
                <button className="text-gray-300 hover:text-red-500 flex items-center gap-1.5 transition-colors group">
                  <Trash2 size={14} />
                  <span className="text-[9px] font-bold">Remove</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ServiceCartItems() {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-sm shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gray-50/50 px-6 py-3 border-b border-gray-100 flex items-center gap-3">
          <div className="w-6 h-6 bg-[#FF851B] rounded-full flex items-center justify-center text-[8px] text-white font-bold">
            CS
          </div>
          <h3 className="font-bold text-[#003366] text-[10px] tracking-widest">
            Creative Studio
          </h3>
        </div>
        <div className="p-8 space-y-8">
          <div className="flex gap-6">
            <div className="w-24 h-24 bg-gray-100 rounded-md overflow-hidden shrink-0 border border-gray-100">
              <img
                src="https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=200"
                className="w-full h-full object-cover"
                alt="serv"
              />
            </div>
            <div className="flex-grow flex flex-col justify-between py-1">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-gray-800 text-xs tracking-tight">
                    Professional Logo Design
                  </h4>
                  <p className="text-[9px] text-[#0074D9] font-bold mt-1">
                    Premium Branding Package
                  </p>
                </div>
                <span className="font-bold text-[#FF851B] text-base">
                  ₱1,903.3
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#F8FAFC] p-6 rounded-md border border-gray-100">
            {["Deadline", "Package", "Business Type", "Brief"].map((field) => (
              <div key={field} className="flex flex-col gap-1.5">
                <label className="text-[8px] font-bold text-gray-400 tracking-widest">
                  {field}
                </label>
                <input
                  type="text"
                  placeholder="..."
                  className="bg-white border border-gray-200 rounded-sm px-3 py-2 text-[11px] focus:outline-none focus:border-[#003366]"
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <button className="text-gray-300 hover:text-red-500 flex items-center gap-1.5 transition-colors group">
              <Trash2 size={14} />
              <span className="text-[9px] font-bold">Remove</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CartSummary({ type, onCheckout }) {
  return (
    <div className="bg-white rounded-sm shadow-sm border border-gray-100 p-8 flex flex-col">
      <h2 className="text-[11px] font-bold text-[#003366] tracking-[0.2em] mb-8 border-b border-gray-50 pb-4">
        Order Summary
      </h2>

      <div className="space-y-4 mb-8">
        <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 tracking-widest">
          <span>Subtotal (5 items)</span>
          <span className="text-gray-700">₱1,903.3</span>
        </div>
        <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 tracking-widest">
          <span>{type === "product" ? "Shipping fee" : "Platform fee"}</span>
          <span className="text-gray-700">₱50.0</span>
        </div>
        <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 tracking-widest">
          <span>Estimated fee</span>
          <span className="text-gray-700">₱25.0</span>
        </div>
      </div>

      {/* Voucher Box */}
      <div className="mb-10 bg-[#F8FAFC] p-5 rounded-md border border-gray-200/50">
        <label className="text-[8px] font-bold text-gray-400 tracking-widest block mb-2">
          Voucher Code
        </label>
        <div className="flex gap-2">
          <div className="relative flex-grow">
            <Ticket
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300"
            />
            <input
              type="text"
              placeholder="Enter..."
              className="w-full pl-9 pr-2 py-2.5 border border-gray-200 rounded-sm text-[11px] focus:outline-none"
            />
          </div>
          <button className="bg-[#003366] text-white px-5 py-2.5 rounded-sm text-[10px] font-bold">
            Apply
          </button>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-6 mb-8 flex flex-col items-end">
        <div className="flex justify-between items-center w-full">
          <span className="text-[10px] font-bold text-[#003366] tracking-wider">
            Total Amount
          </span>
          <span className="text-3xl font-bold text-[#FF851B] tracking-tighter">
            ₱1,953.3
          </span>
        </div>
        <span className="text-[8px] text-gray-300 font-bold mt-1">
          VAT Included
        </span>
      </div>

      {/* FIXED BUTTON: Added the onClick handler */}
      <button
        onClick={onCheckout}
        className="w-full bg-[#FF851B] text-white py-3.5 rounded-md font-bold text-[11px] tracking-widest hover:bg-[#E67616] transition-all shadow-lg active:scale-95 mb-4"
      >
        {type === "product" ? "Proceed to Checkout" : "Place Order Now"}
      </button>

      <Link
        to="/"
        className="text-center text-[9px] font-bold text-gray-400 tracking-[0.3em] hover:text-[#003366] block italic"
      >
        Continue Shopping
      </Link>
    </div>
  );
}
