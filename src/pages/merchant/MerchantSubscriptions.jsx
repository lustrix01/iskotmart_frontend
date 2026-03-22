import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  Clock,
  PauseCircle,
  PlayCircle,
  ArrowRight,
  Zap,
  ShieldCheck,
  X,
  AlertTriangle,
} from "lucide-react";

export default function MerchantSubscriptions() {
  // --- STATE MANAGEMENT ---
  const [activeTab, setActiveTab] = useState("current");
  const [isPaused, setIsPaused] = useState(false);
  const [showModal, setShowModal] = useState(null); // 'edit' or 'postpone'
  const [notification, setNotification] = useState(null);

  const [myPlan, setMyPlan] = useState({
    id: "pro",
    name: "Isko Pro Seller",
    price: "₱499",
    billingDate: "April 22, 2026",
    features: [
      "Unlimited Products",
      "Priority Support",
      "Advanced Analytics",
      "Featured Shop Badge",
    ],
  });

  const allPlans = [
    {
      id: "basic",
      name: "Starter Merchant",
      price: "Free",
      features: ["50 Products", "Standard Support", "Basic Analytics"],
    },
    {
      id: "pro",
      name: "Isko Pro Seller",
      price: "₱499",
      features: [
        "Unlimited Products",
        "Priority Support",
        "Advanced Analytics",
        "Featured Shop Badge",
      ],
    },
    {
      id: "boost",
      name: "Market Boost",
      price: "₱999",
      features: [
        "Everything in Pro",
        "Ads Credit (₱500)",
        "Social Media Feature",
        "Monthly Performance Review",
      ],
    },
  ];

  // --- ACTIONS ---
  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSwitchPlan = (plan) => {
    setMyPlan({
      ...plan,
      billingDate: "May 22, 2026", // Reset billing to a month from now
    });
    setActiveTab("current");
    showToast(`Successfully switched to ${plan.name}!`);
  };

  const handlePostpone = () => {
    setMyPlan((prev) => ({ ...prev, billingDate: "May 22, 2026" }));
    setShowModal(null);
    showToast("Billing date postponed by 30 days.");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      {/* --- TOAST NOTIFICATION --- */}
      {notification && (
        <div className="fixed top-20 right-8 z-[100] bg-[#003366] text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right">
          <CheckCircle size={18} className="text-green-400" />
          <span className="text-xs font-bold">{notification}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#003366]">
            Subscriptions & Promos
          </h2>
          <p className="text-gray-500 text-sm">
            Manage your shop's growth and billing details.
          </p>
        </div>
        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-100">
          <button
            onClick={() => setActiveTab("current")}
            className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === "current" ? "bg-[#003366] text-white shadow-md" : "text-gray-400 hover:text-[#003366]"}`}
          >
            My Subscription
          </button>
          <button
            onClick={() => setActiveTab("plans")}
            className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === "plans" ? "bg-[#003366] text-white shadow-md" : "text-gray-400 hover:text-[#003366]"}`}
          >
            Explore Plans
          </button>
        </div>
      </div>

      {activeTab === "current" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <ShieldCheck size={120} />
              </div>

              <div className="flex items-start justify-between relative z-10">
                <div>
                  <span
                    className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${isPaused ? "bg-orange-100 text-orange-600" : "bg-green-100 text-green-600"}`}
                  >
                    {isPaused ? "Paused" : "Active Plan"}
                  </span>
                  <h3 className="text-3xl font-black text-[#003366] mt-4 mb-2">
                    {myPlan.name}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Next billing date:{" "}
                    <span className="text-[#003366] font-bold">
                      {myPlan.billingDate}
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-[#FF851B]">
                    {myPlan.price}
                  </p>
                  <p className="text-gray-400 text-[10px] uppercase font-bold tracking-tighter">
                    Per Month
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-gray-50 flex flex-wrap gap-4">
                <button
                  onClick={() => {
                    setIsPaused(!isPaused);
                    showToast(
                      isPaused ? "Subscription Resumed" : "Subscription Paused",
                    );
                  }}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold transition-all ${isPaused ? "bg-green-500 text-white" : "bg-orange-50 text-[#FF851B] hover:bg-orange-100"}`}
                >
                  {isPaused ? (
                    <PlayCircle size={18} />
                  ) : (
                    <PauseCircle size={18} />
                  )}
                  {isPaused ? "Resume" : "Pause"}
                </button>
                <button
                  onClick={() => setShowModal("postpone")}
                  className="flex items-center gap-2 bg-gray-50 text-gray-500 px-6 py-3 rounded-xl text-xs font-bold hover:bg-gray-100 transition-all"
                >
                  <Clock size={18} /> Postpone
                </button>
                <button
                  onClick={() => setShowModal("edit")}
                  className="flex items-center gap-2 bg-[#003366] text-white px-6 py-3 rounded-xl text-xs font-bold hover:bg-[#002244] shadow-lg shadow-blue-900/20 transition-all"
                >
                  Edit Details
                </button>
              </div>
            </div>

            <div className="bg-[#002244] rounded-2xl p-8 text-white relative overflow-hidden shadow-xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                  <Zap size={24} className="text-[#FF851B]" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">Marketplace Boost Promo</h4>
                  <p className="text-white/60 text-xs">
                    Unlock higher visibility in student search results.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab("plans")}
                className="bg-[#FF851B] text-white px-8 py-3 rounded-xl text-xs font-bold hover:bg-[#E67716] transition-all"
              >
                Upgrade to Boost
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col">
            <h4 className="font-bold text-[#003366] mb-6">Plan Benefits</h4>
            <div className="space-y-4 flex-grow">
              {myPlan.features.map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle size={18} className="text-green-500 shrink-0" />
                  <span className="text-xs text-gray-600 font-medium">
                    {feature}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* --- EXPLORE PLANS TAB --- */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {allPlans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-3xl p-8 border transition-all flex flex-col ${myPlan.id === plan.id ? "border-[#003366] ring-4 ring-blue-50 shadow-xl" : "border-gray-100 shadow-sm hover:shadow-md"}`}
            >
              <h4 className="text-lg font-bold text-[#003366]">{plan.name}</h4>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-black text-[#003366]">
                  {plan.price}
                </span>
                {plan.price !== "Free" && (
                  <span className="text-gray-400 text-xs font-bold">/mo</span>
                )}
              </div>

              <div className="mt-8 space-y-4 flex-grow">
                {plan.features.map((feature, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 text-xs text-gray-600 font-medium"
                  >
                    <CheckCircle
                      size={16}
                      className={
                        myPlan.id === plan.id
                          ? "text-blue-500"
                          : "text-gray-300"
                      }
                    />
                    {feature}
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleSwitchPlan(plan)}
                disabled={myPlan.id === plan.id}
                className={`mt-10 w-full py-4 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 ${
                  myPlan.id === plan.id
                    ? "bg-gray-100 text-gray-400 cursor-default"
                    : "bg-[#FF851B] text-white hover:bg-[#E67716] shadow-lg shadow-orange-500/20"
                }`}
              >
                {myPlan.id === plan.id ? "Active Plan" : "Choose Plan"}
                {myPlan.id !== plan.id && <ArrowRight size={16} />}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* --- MODALS --- */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#003366]/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative animate-in zoom-in duration-200">
            <button
              onClick={() => setShowModal(null)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>

            {showModal === "postpone" ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Clock size={32} className="text-[#003366]" />
                </div>
                <h3 className="text-xl font-black text-[#003366] mb-2">
                  Postpone Billing?
                </h3>
                <p className="text-gray-500 text-xs mb-8">
                  This will move your next payment date by 30 days. You will
                  keep your benefits until then.
                </p>
                <button
                  onClick={handlePostpone}
                  className="w-full bg-[#003366] text-white py-4 rounded-xl font-bold text-xs shadow-xl"
                >
                  Confirm Postpone
                </button>
              </div>
            ) : (
              <div>
                <h3 className="text-xl font-black text-[#003366] mb-6">
                  Edit Subscription
                </h3>
                <div className="space-y-4 mb-8">
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">
                      Payment Method
                    </p>
                    <p className="text-xs font-bold text-gray-700">
                      GCash (**** 8821)
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">
                      Billing Cycle
                    </p>
                    <p className="text-xs font-bold text-gray-700">
                      Monthly (Manual Renewal)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(null)}
                  className="w-full bg-[#FF851B] text-white py-4 rounded-xl font-bold text-xs shadow-xl"
                >
                  Save Changes
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
