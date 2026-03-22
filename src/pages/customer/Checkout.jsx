import React, { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import {
  MapPin,
  Truck,
  Store,
  Wallet,
  Smartphone,
  ChevronRight,
  Info,
  Calendar,
  Clock,
  CheckCircle2,
  ShoppingBag,
  ArrowRight,
  MessageSquare,
  ShieldCheck,
  X,
  Handshake, // Added for Meetup icon
} from "lucide-react";

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const type = searchParams.get("type") || "product";

  const [deliveryMethod, setDeliveryMethod] = useState("standard");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [showSuccess, setShowSuccess] = useState(false);
  const [showGCashModal, setShowGCashModal] = useState(false);
  const [isProcessingGCash, setIsProcessingGCash] = useState(false);

  // Price Calculation Logic
  const subtotal = 1903.3;
  const shippingFee = deliveryMethod === "standard" ? 50.0 : 0.0;
  const total = subtotal + shippingFee;

  // Simulation handler for placing order
  const handlePlaceOrder = () => {
    if (paymentMethod === "gcash") {
      setShowGCashModal(true);
    } else {
      setShowSuccess(true);
    }
  };

  // GCash simulation logic
  const handleGCashSubmit = () => {
    setIsProcessingGCash(true);
    setTimeout(() => {
      setIsProcessingGCash(false);
      setShowGCashModal(false);
      setShowSuccess(true);
    }, 2000);
  };

  return (
    <div className="bg-[#F5F7F9] min-h-screen pb-20 font-sans relative">
      {/* 1. BREADCRUMBS */}
      <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center gap-2 text-[11px] text-gray-400 font-bold tracking-wider">
        <Link to="/" className="hover:text-[#003366] transition-colors italic">
          Home
        </Link>
        <ChevronRight size={10} />
        <Link
          to="/cart"
          className="hover:text-[#003366] transition-colors italic"
        >
          Cart
        </Link>
        <ChevronRight size={10} />
        <span className="text-[#003366] italic">
          Checkout: {type === "product" ? "Product" : "Service"}
        </span>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 flex flex-col lg:flex-row gap-8 items-start">
        {/* LEFT SIDE: DETAILS */}
        <div className="flex-grow w-full space-y-6">
          {/* Section 1: Address or Requirements */}
          <div className="bg-white rounded-sm shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50/50 px-6 py-3 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-[#003366] text-[12px] tracking-wide">
                {type === "product"
                  ? "Shipping address"
                  : "Service requirements"}
              </h3>
              <button className="text-[10px] text-[#FF851B] font-bold hover:underline">
                Edit
              </button>
            </div>
            <div className="p-6">
              {type === "product" ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-bold text-gray-800 text-sm">
                      Owhie Lumbang
                    </span>
                    <span className="text-gray-400 font-bold text-xs border-l pl-3">
                      09564499020
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="bg-[#FF851B] text-white text-[9px] font-bold px-2 py-0.5 rounded-sm mt-1">
                      Home
                    </span>
                    <p className="text-gray-500 text-xs leading-relaxed">
                      BRGY 38 GOGON LEGAZPI CITY 1035, Bgy. 38 - Gogon (Bgy.
                      54), Legazpi, Albay
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-6">
                  <div className="flex items-center gap-3">
                    <Calendar className="text-[#0074D9]" size={18} />
                    <div>
                      <p className="text-[9px] text-gray-400 font-bold">
                        Target deadline
                      </p>
                      <p className="text-xs font-bold text-gray-700">
                        March 30, 2026
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="text-[#0074D9]" size={18} />
                    <div>
                      <p className="text-[9px] text-gray-400 font-bold">
                        Complexity
                      </p>
                      <p className="text-xs font-bold text-gray-700">
                        Premium Branding
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Methods */}
          <div className="bg-white rounded-sm shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50/50 px-6 py-3 border-b border-gray-100">
              <h3 className="font-bold text-[#003366] text-[12px] tracking-wide">
                {type === "product" ? "Delivery method" : "Service mode"}
              </h3>
            </div>
            <div className="p-6 space-y-3">
              {/* CHOICE 1: Standard */}
              <MethodCard
                id="standard"
                selected={deliveryMethod === "standard"}
                onClick={setDeliveryMethod}
                icon={<Truck size={20} />}
                title={
                  type === "product" ? "Standard delivery" : "Online / Remote"
                }
                desc={
                  type === "product"
                    ? "3-5 business days via campus rider"
                    : "Via Email/Cloud Link"
                }
                price={type === "product" ? "₱50.0" : "₱0.0"}
              />

              {/* CHOICE 2: Meetup (Now integrated for both types) */}
              <MethodCard
                id="pickup"
                selected={deliveryMethod === "pickup"}
                onClick={setDeliveryMethod}
                icon={<Handshake size={20} />}
                title={
                  type === "product" ? "Campus Meetup" : "On-campus meeting"
                }
                desc={
                  type === "product"
                    ? "Direct hand-over on BU Campus"
                    : "BU Main Campus Student Lounge"
                }
                price="₱0.0"
              />

              {/* CONTEXTUAL ALERT FOR MEETUP */}
              {deliveryMethod === "pickup" && (
                <div className="mt-4 p-4 bg-blue-50/50 border border-blue-100 rounded-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-1">
                  <MessageSquare
                    className="text-[#0074D9] shrink-0"
                    size={16}
                  />
                  <div>
                    <p className="text-[11px] font-bold text-[#003366]">
                      IskoChat Coordination Required
                    </p>
                    <p className="text-[10px] text-gray-500 leading-relaxed mt-0.5">
                      You have selected <b>Meetup</b>. Please ensure you
                      coordinate with the student merchant through IskoChat to
                      agree on the specific college, building, or landmark for
                      the hand-over.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Payment */}
          <div className="bg-white rounded-sm shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50/50 px-6 py-3 border-b border-gray-100">
              <h3 className="font-bold text-[#003366] text-[12px] tracking-wide">
                Payment method
              </h3>
            </div>
            <div className="p-6 space-y-3">
              <MethodCard
                id="cod"
                selected={paymentMethod === "cod"}
                onClick={setPaymentMethod}
                icon={<Wallet size={20} />}
                title={
                  type === "product"
                    ? "Cash on Delivery / Hand-over"
                    : "Pay on meetup"
                }
                desc="Pay directly in cash during the transaction"
              />
              <MethodCard
                id="gcash"
                selected={paymentMethod === "gcash"}
                onClick={setPaymentMethod}
                icon={<Smartphone size={20} />}
                title="GCash"
                desc="Pay securely with GCash e-wallet"
              />
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: SUMMARY */}
        <aside className="w-full lg:w-[450px] lg:sticky lg:top-24">
          <div className="bg-white rounded-sm shadow-md border border-gray-100 p-8">
            <h2 className="text-xs font-bold text-[#003366] tracking-wide mb-8 border-b border-gray-50 pb-4">
              Order summary
            </h2>

            <div className="space-y-4 mb-8">
              {[1, 2].map((i) => (
                <div key={i} className="flex gap-4 items-center">
                  <div className="w-12 h-12 bg-gray-50 border border-gray-100 rounded-sm overflow-hidden shrink-0">
                    <img
                      src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=100"
                      className="w-full h-full object-cover"
                      alt="item"
                    />
                  </div>
                  <div className="flex-grow">
                    <p className="text-[10px] font-bold text-gray-700 truncate">
                      BU Canvas Tote Bag - Isko Originals
                    </p>
                    <p className="text-[9px] text-gray-400 font-semibold">
                      Qty: 1 x ₱{subtotal / 2}
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-gray-800">
                    ₱{(subtotal / 2).toFixed(1)}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-4 border-t border-gray-50 pt-6 mb-8 text-[11px] font-bold text-gray-400 tracking-wider">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-gray-700 font-bold">
                  ₱{subtotal.toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Shipping / Meetup fee</span>
                <span className="text-gray-700 font-bold">
                  ₱{shippingFee.toFixed(1)}
                </span>
              </div>
            </div>

            <div className="border-t-2 border-gray-50 pt-6 mb-8 flex justify-between items-baseline">
              <span className="text-[11px] font-bold text-[#003366] tracking-wider">
                Total
              </span>
              <span className="text-2xl font-bold text-[#FF851B]">
                ₱{total.toFixed(1)}
              </span>
            </div>

            <button
              onClick={handlePlaceOrder}
              className="w-full bg-[#FF851B] text-white py-4 rounded-md font-bold text-xs tracking-wide hover:bg-[#E67616] transition-all shadow-lg shadow-orange-100 active:scale-95"
            >
              {paymentMethod === "gcash"
                ? "Proceed to GCash"
                : "Place order now"}
            </button>
          </div>
        </aside>
      </div>

      {/* GCASH SIMULATION MODAL */}
      {showGCashModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => !isProcessingGCash && setShowGCashModal(false)}
          ></div>
          <div className="bg-white w-full max-w-[360px] rounded-2xl overflow-hidden relative z-10 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-[#0055E3] p-6 text-white text-center">
              <div className="flex justify-between items-center mb-6">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/GCash_logo.svg/1200px-GCash_logo.svg.png"
                  className="h-6 brightness-0 invert"
                  alt="gcash"
                />
                <button onClick={() => setShowGCashModal(false)}>
                  <X size={20} />
                </button>
              </div>
              <p className="text-[10px] opacity-80 font-bold uppercase tracking-widest">
                Amount to Pay
              </p>
              <h4 className="text-3xl font-black mt-1">₱{total.toFixed(1)}</h4>
            </div>

            <div className="p-8 space-y-6">
              {isProcessingGCash ? (
                <div className="py-10 text-center space-y-4">
                  <div className="w-12 h-12 border-4 border-[#0055E3] border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-xs font-bold text-[#0055E3] animate-pulse uppercase tracking-widest">
                    Verifying Payment...
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase">
                      Mobile Number
                    </label>
                    <div className="flex items-center gap-2 border-b-2 border-gray-100 py-2">
                      <span className="text-sm font-bold text-gray-400">
                        +63
                      </span>
                      <input
                        type="text"
                        className="bg-transparent outline-none font-bold text-gray-700 w-full"
                        defaultValue="9564499020"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase">
                      Enter 4-Digit MPIN
                    </label>
                    <input
                      type="password"
                      placeholder="••••"
                      className="w-full border-b-2 border-gray-100 py-2 outline-none font-bold text-2xl tracking-[10px] focus:border-[#0055E3]"
                      maxLength={4}
                    />
                  </div>
                  <button
                    onClick={handleGCashSubmit}
                    className="w-full bg-[#0055E3] text-white py-4 rounded-full font-black text-xs shadow-lg hover:bg-[#0044B8] transition-all mt-4"
                  >
                    Confirm & Pay
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS POPUP MODAL */}
      {showSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div
            className="absolute inset-0 bg-[#003366]/40 backdrop-blur-sm transition-opacity"
            onClick={() => setShowSuccess(false)}
          ></div>
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={48} className="text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-[#003366] mb-2 tracking-tight">
                Order placed successfully!
              </h2>
              <p className="text-gray-500 text-sm mb-10 leading-relaxed px-4">
                Thank you! Your order has been received.{" "}
                {deliveryMethod === "pickup"
                  ? "Please check your IskoChat to finalize the meetup details with the student merchant."
                  : "Your items will be delivered to your address soon."}
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => navigate("/profile/orders")}
                  className="w-full bg-[#003366] text-white py-3.5 rounded-md font-bold text-sm hover:bg-[#002244] transition-all flex items-center justify-center gap-2"
                >
                  View my orders
                  <ArrowRight size={18} />
                </button>
                <button
                  onClick={() => navigate("/")}
                  className="w-full bg-white text-gray-500 py-3.5 rounded-md font-bold text-sm border border-gray-200 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                >
                  <ShoppingBag size={18} />
                  Continue shopping
                </button>
              </div>
            </div>
            <div className="h-1.5 bg-[#FF851B] w-full"></div>
          </div>
        </div>
      )}
    </div>
  );
}

function MethodCard({ id, selected, onClick, icon, title, desc, price }) {
  return (
    <div
      onClick={() => onClick(id)}
      className={`p-4 border-2 rounded-md flex items-center justify-between cursor-pointer transition-all ${
        selected
          ? "border-[#FF851B] bg-[#FFF7F0]"
          : "border-gray-100 bg-gray-50/30 hover:border-gray-200"
      }`}
    >
      <div className="flex items-center gap-4">
        <div className={selected ? "text-[#FF851B]" : "text-gray-400"}>
          {icon}
        </div>
        <div>
          <p className="text-xs font-bold text-gray-800 tracking-tight">
            {title}
          </p>
          <p className="text-[10px] text-gray-400 font-semibold">{desc}</p>
        </div>
      </div>
      {price && (
        <span className="font-bold text-[#FF851B] text-sm">{price}</span>
      )}
    </div>
  );
}
