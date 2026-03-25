import React, { useState } from "react";
import {
  Camera,
  Save,
  ShieldCheck,
  Heart,
  MessageSquare,
  CheckCircle,
  X,
  Eye,
  Lock,
  User as UserIcon,
  Mail,
  Key,
  AlertCircle,
  Truck,
  Wallet,
  MapPin,
  Smartphone,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

export default function ShopSettings() {
  const [activeTab, setActiveTab] = useState("profile"); // 'profile', 'fulfillment', or 'security'
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Shop Data State (FR-47: Customize product page / shop profile)
  const [shopData, setShopData] = useState({
    name: "TechHub Electronics",
    bio: "Digital art, custom illustrations, and graphic design services. We specialize in cute and aesthetic branding for student orgs, thesis projects, and personal works.",
    banner:
      "https://images.unsplash.com/photo-1555680202-c86f0e12f086?q=80&w=1200",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=250",
  });

  // Fulfillment Data State (FR-50 & FR-51)
  const [fulfillment, setFulfillment] = useState({
    acceptsCOD: true,
    acceptsGCash: true,
    allowMeetup: true,
    allowDelivery: true,
    deliveryFee: 50,
  });

  // Simulation handler
  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }, 1500);
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-6xl mx-auto pb-20 space-y-6">
      {/* --- TOP NAVIGATION TABS --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex bg-gray-50 p-1 rounded-xl w-full md:w-auto overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-bold transition-all shrink-0 ${activeTab === "profile" ? "bg-white text-[#FF851B] shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
          >
            <Eye size={16} /> Shop Profile
          </button>
          {/* FR-50 & FR-51 Tab */}
          <button
            onClick={() => setActiveTab("fulfillment")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-bold transition-all shrink-0 ${activeTab === "fulfillment" ? "bg-white text-[#FF851B] shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
          >
            <Truck size={16} /> Payment & Delivery
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-bold transition-all shrink-0 ${activeTab === "security" ? "bg-white text-[#FF851B] shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
          >
            <Lock size={16} /> Account Security
          </button>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full md:w-auto bg-[#FF851B] text-white px-8 py-2.5 rounded-xl font-bold text-xs shadow-md hover:bg-[#e67616] transition-all disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2 shrink-0"
        >
          {isSaving ? (
            "Saving..."
          ) : (
            <>
              <Save size={16} /> Save Changes
            </>
          )}
        </button>
      </div>

      {/* --- TAB CONTENT: SHOP PROFILE (FR-47) --- */}
      {activeTab === "profile" && (
        <div className="bg-white border border-gray-100 rounded-3xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-2 duration-500">
          {/* Banner */}
          <div className="h-52 bg-[#003366] relative group overflow-hidden">
            <img
              src={shopData.banner}
              alt="Banner"
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 cursor-pointer">
              <Camera size={24} className="text-white" />
              <span className="text-[10px] text-white font-bold uppercase tracking-widest">
                Update Banner
              </span>
            </div>
          </div>

          <div className="px-10 pb-10 relative">
            {/* Avatar Row */}
            <div className="flex justify-between items-end -mt-16 mb-8">
              <div className="relative group cursor-pointer">
                <div className="w-36 h-36 rounded-full border-[6px] border-white shadow-xl overflow-hidden bg-gray-100">
                  <img
                    src={shopData.avatar}
                    alt="Logo"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center border-[6px] border-white text-white">
                  <Camera size={24} />
                </div>
              </div>
              <div className="flex gap-3 opacity-20 grayscale pointer-events-none select-none mb-4">
                <div className="px-6 py-2.5 bg-white border border-gray-200 text-gray-400 text-xs font-bold rounded-xl flex items-center gap-2">
                  <MessageSquare size={16} /> Message
                </div>
                <div className="px-8 py-2.5 bg-[#FF851B] text-white text-xs font-bold rounded-xl flex items-center gap-2">
                  <Heart size={16} /> Follow
                </div>
              </div>
            </div>

            {/* Editable Fields */}
            <div className="max-w-3xl mb-10">
              <div className="flex items-center gap-2 mb-4 group">
                <input
                  type="text"
                  value={shopData.name}
                  onChange={(e) =>
                    setShopData({ ...shopData, name: e.target.value })
                  }
                  className="text-3xl font-extrabold text-[#003366] bg-transparent border-b border-transparent hover:border-gray-200 focus:border-[#FF851B] focus:outline-none transition-all w-full"
                />
                <ShieldCheck size={28} className="text-[#0074D9]" />
              </div>
              <textarea
                rows="3"
                value={shopData.bio}
                onChange={(e) =>
                  setShopData({ ...shopData, bio: e.target.value })
                }
                className="w-full text-sm text-gray-500 leading-relaxed bg-transparent hover:bg-gray-50/50 p-2 rounded-lg border border-transparent focus:border-[#FF851B] focus:bg-white focus:outline-none transition-all resize-none"
              />
            </div>

            {/* Public Stats Preview */}
            <div className="flex flex-wrap gap-12 border-t border-gray-100 pt-8 opacity-60">
              {[
                { label: "Rating", val: "4.9" },
                { label: "Sold", val: "1.2k+" },
                { label: "Response", val: "98%" },
                { label: "Joined", val: "Aug 2024" },
              ].map((s, i) => (
                <div key={i}>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                    {s.label}
                  </p>
                  <p className="text-sm font-bold text-[#003366]">{s.val}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB CONTENT: PAYMENT & DELIVERY (FR-50 & FR-51) --- */}
      {activeTab === "fulfillment" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in slide-in-from-bottom-2 duration-500">
          {/* FR-50: Payment Options */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
            <div className="flex items-center gap-3 mb-6 border-b border-gray-50 pb-4">
              <div className="p-2.5 bg-blue-50 text-[#0074D9] rounded-xl">
                <Wallet size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#003366]">
                  Payment Options
                </h3>
                <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">
                  Configure accepted methods
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* COD Toggle */}
              <div
                className={`p-5 rounded-2xl border-2 flex items-center justify-between transition-all cursor-pointer ${fulfillment.acceptsCOD ? "border-[#FF851B] bg-orange-50/30" : "border-gray-100 bg-gray-50/50"}`}
                onClick={() =>
                  setFulfillment({
                    ...fulfillment,
                    acceptsCOD: !fulfillment.acceptsCOD,
                  })
                }
              >
                <div className="flex items-center gap-4">
                  <div
                    className={
                      fulfillment.acceptsCOD
                        ? "text-[#FF851B]"
                        : "text-gray-400"
                    }
                  >
                    <Wallet size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">
                      Cash on Delivery / Meetup
                    </p>
                    <p className="text-[10px] text-gray-500 font-medium mt-0.5">
                      Allow buyers to pay in cash upon receiving the item.
                    </p>
                  </div>
                </div>
                {fulfillment.acceptsCOD ? (
                  <ToggleRight size={32} className="text-[#FF851B]" />
                ) : (
                  <ToggleLeft size={32} className="text-gray-300" />
                )}
              </div>

              {/* GCash Toggle */}
              <div
                className={`p-5 rounded-2xl border-2 flex items-center justify-between transition-all cursor-pointer ${fulfillment.acceptsGCash ? "border-[#FF851B] bg-orange-50/30" : "border-gray-100 bg-gray-50/50"}`}
                onClick={() =>
                  setFulfillment({
                    ...fulfillment,
                    acceptsGCash: !fulfillment.acceptsGCash,
                  })
                }
              >
                <div className="flex items-center gap-4">
                  <div
                    className={
                      fulfillment.acceptsGCash
                        ? "text-[#FF851B]"
                        : "text-gray-400"
                    }
                  >
                    <Smartphone size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">
                      GCash E-Wallet
                    </p>
                    <p className="text-[10px] text-gray-500 font-medium mt-0.5">
                      Secure, cashless transactions integrated with IskoMart.
                    </p>
                  </div>
                </div>
                {fulfillment.acceptsGCash ? (
                  <ToggleRight size={32} className="text-[#FF851B]" />
                ) : (
                  <ToggleLeft size={32} className="text-gray-300" />
                )}
              </div>
            </div>

            {!fulfillment.acceptsCOD && !fulfillment.acceptsGCash && (
              <div className="mt-4 p-3 bg-red-50 text-red-500 text-xs font-bold rounded-lg flex items-center gap-2">
                <AlertCircle size={16} /> You must select at least one payment
                method to sell.
              </div>
            )}
          </div>

          {/* FR-51: Delivery Options & Cost */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
            <div className="flex items-center gap-3 mb-6 border-b border-gray-50 pb-4">
              <div className="p-2.5 bg-green-50 text-green-600 rounded-xl">
                <Truck size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#003366]">
                  Delivery Options
                </h3>
                <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">
                  Configure shipping & rates
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Meetup Toggle */}
              <div
                className={`p-5 rounded-2xl border-2 flex items-center justify-between transition-all cursor-pointer ${fulfillment.allowMeetup ? "border-green-500 bg-green-50/30" : "border-gray-100 bg-gray-50/50"}`}
                onClick={() =>
                  setFulfillment({
                    ...fulfillment,
                    allowMeetup: !fulfillment.allowMeetup,
                  })
                }
              >
                <div className="flex items-center gap-4">
                  <div
                    className={
                      fulfillment.allowMeetup
                        ? "text-green-500"
                        : "text-gray-400"
                    }
                  >
                    <MapPin size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">
                      Campus Meetup
                    </p>
                    <p className="text-[10px] text-gray-500 font-medium mt-0.5">
                      Free, direct hand-over inside the university campus.
                    </p>
                  </div>
                </div>
                {fulfillment.allowMeetup ? (
                  <ToggleRight size={32} className="text-green-500" />
                ) : (
                  <ToggleLeft size={32} className="text-gray-300" />
                )}
              </div>

              {/* Standard Delivery Toggle */}
              <div
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer ${fulfillment.allowDelivery ? "border-green-500 bg-green-50/30" : "border-gray-100 bg-gray-50/50"}`}
              >
                <div
                  className="flex items-center justify-between"
                  onClick={() =>
                    setFulfillment({
                      ...fulfillment,
                      allowDelivery: !fulfillment.allowDelivery,
                    })
                  }
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={
                        fulfillment.allowDelivery
                          ? "text-green-500"
                          : "text-gray-400"
                      }
                    >
                      <Truck size={24} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">
                        Standard Local Delivery
                      </p>
                      <p className="text-[10px] text-gray-500 font-medium mt-0.5">
                        Ship items directly to dorms or addresses via rider.
                      </p>
                    </div>
                  </div>
                  {fulfillment.allowDelivery ? (
                    <ToggleRight size={32} className="text-green-500" />
                  ) : (
                    <ToggleLeft size={32} className="text-gray-300" />
                  )}
                </div>

                {/* Shipping Cost Config (Appears only if Delivery is ON) */}
                {fulfillment.allowDelivery && (
                  <div
                    className="mt-4 pt-4 border-t border-green-200/50 pl-10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">
                      Base Shipping Cost (₱)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        value={fulfillment.deliveryFee}
                        onChange={(e) =>
                          setFulfillment({
                            ...fulfillment,
                            deliveryFee: Number(e.target.value),
                          })
                        }
                        className="w-32 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-[#003366] focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                      />
                      <span className="text-[10px] text-gray-400 font-medium">
                        Applied to buyer at checkout
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB CONTENT: ACCOUNT SECURITY --- */}
      {activeTab === "security" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-2 duration-500">
          <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-orange-50 text-[#FF851B] rounded-xl">
                <Key size={20} />
              </div>
              <h3 className="text-lg font-bold text-[#003366]">
                Update Password
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                  Current Password
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"
                    size={16}
                  />
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl text-sm focus:bg-white border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-[#FF851B] outline-none transition-all"
                  />
                </div>
              </div>
              <div className="hidden md:block"></div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                  New Password
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"
                    size={16}
                  />
                  <input
                    type="password"
                    placeholder="Min. 8 characters"
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl text-sm focus:bg-white border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-[#FF851B] outline-none transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"
                    size={16}
                  />
                  <input
                    type="password"
                    placeholder="Confirm password"
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl text-sm focus:bg-white border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-[#FF851B] outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
              <h3 className="text-xs font-bold text-[#003366] uppercase tracking-widest mb-6 border-b border-gray-50 pb-4">
                Merchant ID Info
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-50 text-[#0074D9] rounded-full flex items-center justify-center shrink-0">
                    <UserIcon size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">
                      Username
                    </p>
                    <p className="text-xs font-bold text-[#003366]">
                      techhub_electronics_admin
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-50 text-[#0074D9] rounded-full flex items-center justify-center shrink-0">
                    <Mail size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">
                      Recovery Email
                    </p>
                    <p className="text-xs font-bold text-[#003366]">
                      merchant@iskomart.com
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-red-50/50 rounded-3xl border border-red-100 p-8">
              <div className="flex items-center gap-2 text-red-600 mb-2">
                <AlertCircle size={16} />
                <h3 className="text-[10px] font-bold uppercase tracking-widest">
                  Danger Zone
                </h3>
              </div>
              <p className="text-[10px] text-red-400 mb-4 leading-relaxed">
                Closing your shop will remove all your products and services
                from IskoMart permanently.
              </p>
              <button className="w-full py-2.5 bg-white border border-red-200 text-red-500 text-[10px] font-bold rounded-xl hover:bg-red-500 hover:text-white transition-all">
                Close Shop Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- NOTIFICATION TOAST --- */}
      {showToast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-5">
          <div className="bg-[#003366] text-white px-8 py-4 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-4">
            <CheckCircle className="text-[#FF851B]" size={20} />
            <span className="text-xs font-bold uppercase tracking-wider">
              Changes synchronized successfully!
            </span>
            <button
              onClick={() => setShowToast(false)}
              className="ml-4 opacity-50 hover:opacity-100"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
