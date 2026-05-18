import React, { useEffect, useRef, useState } from "react";
import {
  Camera,
  Save,
  ShieldCheck,
  MessageSquare,
  CheckCircle,
  X,
  Eye,
  EyeOff,
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
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

export default function ShopSettings() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const bannerInputRef = useRef(null);
  const avatarInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState("profile"); // 'profile', 'fulfillment', or 'security'
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [showPassword, setShowPassword] = useState({
    current: false,
    next: false,
    confirm: false,
  });
  const [passwordForm, setPasswordForm] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [passwordMessage, setPasswordMessage] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [closeEmail, setCloseEmail] = useState("");
  const [closeError, setCloseError] = useState("");
  const [isClosingShop, setIsClosingShop] = useState(false);
  const [accountInfo, setAccountInfo] = useState({
    username: "",
    email: "",
  });
  const [shopMetrics, setShopMetrics] = useState({
    rating: { average: null, count: 0 },
    sold: 0,
    joined: "",
  });

  // Shop Data State (FR-47: Customize product page / shop profile)
  const [shopData, setShopData] = useState({
    name: "",
    bio: "",
    address: "",
    banner: "/placeholders/shop-banner.svg",
    bannerImage: "",
    avatarImage: "",
    avatar: "/placeholders/avatar.svg",
  });

  // Fulfillment Data State (FR-50 & FR-51)
  const [fulfillment, setFulfillment] = useState({
    acceptsCOD: true,
    acceptsGCash: true,
    allowMeetup: true,
    allowDelivery: true,
    deliveryFee: 50,
  });

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        const [profileResponse, metricsResponse] = await Promise.all([
          fetch("/api/merchant_profile.php", { credentials: "include" }),
          fetch("/api/merchant_shop_metrics.php", { credentials: "include" }),
        ]);
        const metricsPayload = await metricsResponse.json().catch(() => ({}));
        if (!metricsResponse.ok) {
          throw new Error(metricsPayload.error || "Unable to load shop metrics.");
        }
        const response = profileResponse;
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload.error || "Unable to load shop profile.");
        }

        if (isMounted) {
          const profile = payload.profile;
          setShopData((current) => ({
            ...current,
            name: profile.shopName || "",
            bio: profile.shopDescription || "",
            address: profile.address || "",
            banner: profile.bannerUrl || current.banner,
            bannerImage: "",
            avatar: profile.avatarUrl || current.avatar,
          }));
          setAccountInfo({
            username: profile.username || "",
            email: profile.businessEmail || profile.email || "",
          });
          setFulfillment({
            acceptsCOD: Boolean(profile.fulfillment?.acceptsCOD ?? true),
            acceptsGCash: Boolean(profile.fulfillment?.acceptsGCash ?? true),
            allowMeetup: Boolean(profile.fulfillment?.allowMeetup ?? true),
            allowDelivery: Boolean(profile.fulfillment?.allowDelivery ?? true),
            deliveryFee: Number(profile.fulfillment?.deliveryFee ?? 50),
          });
          setShopMetrics(
            metricsPayload.metrics || {
              rating: { average: null, count: 0 },
              sold: 0,
              joined: "",
            },
          );
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(error.message);
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setLoadError("");

    if (!fulfillment.acceptsCOD && !fulfillment.acceptsGCash) {
      setLoadError("At least one payment method must be enabled.");
      setIsSaving(false);
      return;
    }

    if (!fulfillment.allowMeetup && !fulfillment.allowDelivery) {
      setLoadError("At least one delivery option must be enabled.");
      setIsSaving(false);
      return;
    }

    try {
      const response = await fetch("/api/merchant_profile.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          shopName: shopData.name,
          shopDescription: shopData.bio,
          address: shopData.address,
          bannerImage: shopData.bannerImage,
          avatarImage: shopData.avatarImage,
          fulfillment: {
            acceptsCOD: fulfillment.acceptsCOD,
            acceptsGCash: fulfillment.acceptsGCash,
            allowMeetup: fulfillment.allowMeetup,
            allowDelivery: fulfillment.allowDelivery,
            deliveryFee: Number(fulfillment.deliveryFee || 0),
          },
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Unable to save shop profile.");
      }

      const profile = payload.profile;
      setShopData((current) => ({
        ...current,
        name: profile.shopName || "",
        bio: profile.shopDescription || "",
        address: profile.address || "",
        banner: profile.bannerUrl || current.banner,
        bannerImage: "",
        avatar: profile.avatarUrl || current.avatar,
        avatarImage: "",
      }));
      setFulfillment({
        acceptsCOD: Boolean(profile.fulfillment?.acceptsCOD ?? true),
        acceptsGCash: Boolean(profile.fulfillment?.acceptsGCash ?? true),
        allowMeetup: Boolean(profile.fulfillment?.allowMeetup ?? true),
        allowDelivery: Boolean(profile.fulfillment?.allowDelivery ?? true),
        deliveryFee: Number(profile.fulfillment?.deliveryFee ?? 50),
      });
      setIsSaving(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      setLoadError(error.message);
      setIsSaving(false);
    }
  };

  const openCloseShopModal = () => {
    setCloseEmail("");
    setCloseError("");
    setIsCloseModalOpen(true);
  };

  const closeCloseShopModal = () => {
    if (!isClosingShop) {
      setIsCloseModalOpen(false);
      setCloseEmail("");
      setCloseError("");
    }
  };

  const handleCloseShop = async () => {
    const expectedEmail = String(accountInfo.email || "").trim().toLowerCase();
    const typedEmail = closeEmail.trim().toLowerCase();

    setCloseError("");
    if (!expectedEmail || typedEmail !== expectedEmail) {
      setCloseError("Type your merchant email address exactly to continue.");
      return;
    }

    setIsClosingShop(true);
    try {
      const response = await fetch("/api/merchant_profile.php", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: closeEmail.trim() }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Unable to close shop account.");
      }

      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      setCloseError(error.message);
      setIsClosingShop(false);
    }
  };

  const updatePasswordField = (field, value) => {
    setPasswordForm((current) => ({ ...current, [field]: value }));
    setPasswordMessage("");
    setLoadError("");
  };

  const handlePasswordSave = async () => {
    setPasswordMessage("");
    setLoadError("");

    if (passwordForm.next !== passwordForm.confirm) {
      setLoadError("New password and confirmation do not match.");
      return;
    }

    setIsSavingPassword(true);
    try {
      const response = await fetch("/api/change_password.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          currentPassword: passwordForm.current,
          newPassword: passwordForm.next,
          confirmPassword: passwordForm.confirm,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Unable to update password.");
      }

      setPasswordForm({ current: "", next: "", confirm: "" });
      setPasswordMessage(payload.message || "Password has been updated.");
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleBannerUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setLoadError("Banner image must be 5MB or smaller.");
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setLoadError("Banner must be a JPG, PNG, or WebP image.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = String(reader.result || "");
      setShopData((current) => ({
        ...current,
        banner: result,
        bannerImage: result,
      }));
      setLoadError("");
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setLoadError("Profile image must be 5MB or smaller.");
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setLoadError("Profile image must be a JPG, PNG, or WebP image.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = String(reader.result || "");
      setShopData((current) => ({
        ...current,
        avatar: result,
        avatarImage: result,
      }));
      setLoadError("");
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-6xl mx-auto pb-20 space-y-6">
      {loadError && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-xs font-bold text-red-600">
          {loadError}
        </div>
      )}
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

        {activeTab !== "security" && (
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
        )}
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
            <button
              type="button"
              onClick={() => bannerInputRef.current?.click()}
              className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 cursor-pointer"
            >
              <Camera size={24} className="text-white" />
              <span className="text-[10px] text-white font-bold uppercase tracking-widest">
                Update Banner
              </span>
            </button>
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleBannerUpload}
              className="hidden"
            />
          </div>

          <div className="px-10 pb-10 relative">
            {/* Avatar Row */}
            <div className="flex justify-between items-end -mt-16 mb-8">
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="relative group cursor-pointer text-left"
              >
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
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </button>
              <div className="flex gap-3 opacity-20 grayscale pointer-events-none select-none mb-4">
                <div className="px-6 py-2.5 bg-white border border-gray-200 text-gray-400 text-xs font-bold rounded-xl flex items-center gap-2">
                  <MessageSquare size={16} /> Message
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
              <div className="mt-4">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                  Shop Address
                </label>
                <input
                  type="text"
                  value={shopData.address}
                  onChange={(e) =>
                    setShopData({ ...shopData, address: e.target.value })
                  }
                  className="mt-2 w-full text-sm text-gray-500 bg-transparent hover:bg-gray-50/50 p-2 rounded-lg border border-transparent focus:border-[#FF851B] focus:bg-white focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Public Stats Preview */}
            <div className="flex flex-wrap gap-12 border-t border-gray-100 pt-8 opacity-80">
              {[
                {
                  label: "Rating",
                  val:
                    shopMetrics.rating?.average !== null
                      ? `${shopMetrics.rating.average} (${shopMetrics.rating.count})`
                      : "No reviews yet",
                },
                { label: "Sold", val: String(shopMetrics.sold || 0) },
                {
                  label: "Joined",
                  val: shopMetrics.joined
                    ? new Date(`${shopMetrics.joined}T00:00:00`).toLocaleDateString(
                        undefined,
                        { month: "short", year: "numeric" },
                      )
                    : "Not available",
                },
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
                    type={showPassword.current ? "text" : "password"}
                    value={passwordForm.current}
                    onChange={(event) => updatePasswordField("current", event.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-3 bg-gray-50 rounded-xl text-sm focus:bg-white border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-[#FF851B] outline-none transition-all"
                  />
                  <button
                    type="button"
                    aria-label={
                      showPassword.current
                        ? "Hide current password"
                        : "Show current password"
                    }
                    onClick={() =>
                      setShowPassword((current) => ({
                        ...current,
                        current: !current.current,
                      }))
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#003366] transition-colors"
                  >
                    {showPassword.current ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>
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
                    type={showPassword.next ? "text" : "password"}
                    value={passwordForm.next}
                    onChange={(event) => updatePasswordField("next", event.target.value)}
                    placeholder="Min. 10 characters"
                    className="w-full pl-12 pr-12 py-3 bg-gray-50 rounded-xl text-sm focus:bg-white border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-[#FF851B] outline-none transition-all"
                  />
                  <button
                    type="button"
                    aria-label={
                      showPassword.next
                        ? "Hide new password"
                        : "Show new password"
                    }
                    onClick={() =>
                      setShowPassword((current) => ({
                        ...current,
                        next: !current.next,
                      }))
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#003366] transition-colors"
                  >
                    {showPassword.next ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
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
                    type={showPassword.confirm ? "text" : "password"}
                    value={passwordForm.confirm}
                    onChange={(event) => updatePasswordField("confirm", event.target.value)}
                    placeholder="Confirm password"
                    className="w-full pl-12 pr-12 py-3 bg-gray-50 rounded-xl text-sm focus:bg-white border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-[#FF851B] outline-none transition-all"
                  />
                  <button
                    type="button"
                    aria-label={
                      showPassword.confirm
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                    onClick={() =>
                      setShowPassword((current) => ({
                        ...current,
                        confirm: !current.confirm,
                      }))
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#003366] transition-colors"
                  >
                    {showPassword.confirm ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>
                </div>
              </div>
            </div>
            {passwordMessage && (
              <p className="rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-xs font-bold text-green-600">
                {passwordMessage}
              </p>
            )}
            <div className="flex justify-end border-t border-gray-50 pt-5">
              <button
                type="button"
                onClick={handlePasswordSave}
                disabled={
                  isSavingPassword ||
                  !passwordForm.current ||
                  !passwordForm.next ||
                  !passwordForm.confirm
                }
                className="bg-[#FF851B] text-white px-8 py-3 rounded-xl font-bold text-xs shadow-md hover:bg-[#e67616] transition-all disabled:opacity-50"
              >
                {isSavingPassword ? "Updating..." : "Update password"}
              </button>
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
                      {accountInfo.username || "Not available"}
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
                      {accountInfo.email || "Not available"}
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
	                Closing your shop will make your merchant account inactive,
	                hide your listings, and block new checkouts or bookings.
	              </p>
	              <button
	                type="button"
	                onClick={openCloseShopModal}
	                className="w-full py-2.5 bg-white border border-red-200 text-red-500 text-[10px] font-bold rounded-xl hover:bg-red-500 hover:text-white transition-all"
	              >
	                Close Shop Account
	              </button>
            </div>
          </div>
        </div>
	      )}
	
	      {isCloseModalOpen && (
	        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
	          <button
	            type="button"
	            aria-label="Close shop closure confirmation"
	            className="absolute inset-0 bg-[#003366]/40 backdrop-blur-sm animate-in fade-in"
	            onClick={closeCloseShopModal}
	          />
	          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-in zoom-in duration-200">
	            <div className="p-8">
	              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
	                <AlertCircle size={32} className="text-red-500" />
	              </div>
	              <h3 className="text-lg font-bold text-[#003366] text-center mb-2">
	                Close shop account?
	              </h3>
	              <p className="text-xs text-gray-500 text-center leading-relaxed mb-6">
	                Your merchant account will be set to inactive. Customers will
	                no longer see your products or services, and new checkouts or
	                bookings for your shop will be blocked. Existing orders,
	                messages, reviews, and records will remain intact.
	              </p>

	              <label className="block space-y-2 mb-4">
	                <span className="text-[11px] font-bold text-gray-500">
	                  Type your merchant email to confirm
	                </span>
	                <input
	                  type="email"
	                  value={closeEmail}
	                  onChange={(event) => {
	                    setCloseEmail(event.target.value);
	                    setCloseError("");
	                  }}
	                  placeholder={accountInfo.email || "merchant@email.com"}
	                  disabled={isClosingShop}
	                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-300 focus:border-red-400 focus:bg-white outline-none transition-all disabled:opacity-70"
	                />
	              </label>

	              {closeError && (
	                <p className="text-xs font-bold text-red-500 mb-4">
	                  {closeError}
	                </p>
	              )}

	              <div className="flex flex-col gap-3">
	                <button
	                  type="button"
	                  onClick={handleCloseShop}
	                  disabled={
	                    isClosingShop ||
	                    closeEmail.trim().toLowerCase() !==
	                      String(accountInfo.email || "").trim().toLowerCase()
	                  }
	                  className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-bold text-xs shadow-md transition-all disabled:opacity-50 disabled:hover:bg-red-500"
	                >
	                  {isClosingShop ? "Closing shop..." : "Close shop account"}
	                </button>
	                <button
	                  type="button"
	                  onClick={closeCloseShopModal}
	                  disabled={isClosingShop}
	                  className="w-full bg-white text-gray-500 py-3 rounded-xl font-bold text-xs border border-gray-100 hover:bg-gray-50 transition-all disabled:opacity-70"
	                >
	                  Cancel
	                </button>
	              </div>
	            </div>
	            <div className="h-1.5 w-full bg-red-500" />
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
