import React, { useEffect, useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Settings,
  Package,
  ShoppingCart,
  MessageSquare,
  Tag,
  TrendingUp,
  LogOut as LogOutIcon,
  AlertCircle,
  ShieldCheck,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "../context/useAuth";

export default function MerchantLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  // --- FR-41: Securely log in and out of the merchant dashboard ---
  const { logout } = useAuth();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [merchantProfile, setMerchantProfile] = useState({
    shopName: "Merchant Shop",
    initials: "IM",
    avatarUrl: "",
  });

  // --- FR-40: Sidebar provides quick access to settings and catalogs ---
  const menuItems = [
    { name: "Dashboard", path: "/merchant", icon: LayoutDashboard },
    { name: "Shop Settings", path: "/merchant/settings", icon: Settings },
    { name: "Products/Services", path: "/merchant/products", icon: Package },
    { name: "Orders", path: "/merchant/orders", icon: ShoppingCart },
    { name: "Messages", path: "/merchant/messages", icon: MessageSquare },
    { name: "Discount and Voucher", path: "/merchant/discounts", icon: Tag },
    { name: "Insights", path: "/merchant/insights", icon: TrendingUp },
  ];

  const handleConfirmLogout = () => {
    setIsLoggingOut(true);
    setTimeout(async () => {
      if (logout) {
        await logout();
      }
      navigate("/login", { replace: true });
    }, 2000);
  };

  const pageTitle =
    menuItems.find((m) => m.path === location.pathname)?.name || "Dashboard";

  useEffect(() => {
    let isMounted = true;

    const loadMerchantProfile = async () => {
      try {
        const response = await fetch("/api/merchant_dashboard.php", {
          credentials: "include",
        });
        const payload = await response.json();
        if (!response.ok || !isMounted || !payload.profile) {
          return;
        }
        setMerchantProfile({
          shopName: payload.profile.shopName || "Merchant Shop",
          initials: payload.profile.initials || "IM",
          avatarUrl: payload.profile.avatarUrl || "",
        });
      } catch {
        // Keep the neutral placeholder if the profile API is unavailable.
      }
    };

    loadMerchantProfile();

    const handleMerchantProfileUpdate = (event) => {
      const profile = event.detail || {};
      setMerchantProfile((current) => ({
        ...current,
        shopName: profile.shopName || current.shopName,
        avatarUrl: profile.avatarUrl || current.avatarUrl,
      }));
    };
    window.addEventListener("iskomart:merchant-profile-updated", handleMerchantProfileUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener("iskomart:merchant-profile-updated", handleMerchantProfileUpdate);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F7F9] font-sans flex">
      {isMobileNavOpen && (
        <button
          type="button"
          aria-label="Close merchant menu overlay"
          className="fixed inset-0 z-30 bg-[#003366]/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileNavOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen w-64 transform flex-col justify-between bg-[#003366] text-white shadow-xl transition-transform duration-200 lg:translate-x-0 ${
          isMobileNavOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          <div className="h-16 flex items-center justify-center border-b border-white/10 bg-[#002244] px-5 relative">
            <Link to="/merchant" className="text-2xl font-bold tracking-tight">
              <span className="text-[#0074D9]">Isko</span>
              <span className="text-[#FF851B]">Mart</span>
            </Link>
            <button
              type="button"
              aria-label="Close merchant menu"
              onClick={() => setIsMobileNavOpen(false)}
              className="absolute right-5 rounded-md p-2 text-white/70 hover:bg-white/10 hover:text-white lg:hidden"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-4 mt-2 overflow-y-auto max-h-[calc(100vh-140px)] no-scrollbar">
            <p className="text-gray-400 text-[10px] font-bold tracking-widest uppercase mb-4 opacity-50 px-4">
              Shop Management
            </p>
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const isActive =
                  item.path === "/merchant"
                    ? location.pathname === "/merchant"
                    : location.pathname.startsWith(item.path);

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileNavOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold transition-all group ${
                      isActive
                        ? "bg-white/10 text-white border-l-4 border-[#FF851B]"
                        : "text-gray-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <item.icon
                      size={18}
                      className={
                        isActive
                          ? "text-[#FF851B]"
                          : "text-gray-400 group-hover:text-white"
                      }
                    />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="p-4 border-t border-white/10 bg-[#002244]/50">
          <button
            onClick={() => setShowLogoutModal(true)}
            className="flex items-center gap-3 text-gray-400 hover:text-red-400 transition-colors text-xs font-bold w-full px-4 py-3 group rounded-lg hover:bg-white/5"
          >
            <LogOutIcon size={18} />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      <main className="flex min-h-screen flex-grow flex-col lg:ml-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-gray-100 bg-white px-4 shadow-sm sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              aria-label="Open merchant menu"
              onClick={() => setIsMobileNavOpen(true)}
              className="rounded-md border border-gray-100 p-2 text-[#003366] shadow-sm lg:hidden"
            >
              <Menu size={18} />
            </button>
            <h1 className="truncate text-lg font-bold text-[#003366] capitalize">
              {pageTitle}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {/* FR-41 Visual Proof: Secure Session Indicator */}
            <div className="hidden md:flex items-center gap-1.5 bg-green-50 text-green-600 px-3 py-1.5 rounded-full border border-green-100 mr-2">
              <ShieldCheck size={12} />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                Secure Session
              </span>
            </div>

            <div className="flex items-center gap-2 pl-3 border-l border-gray-100">
              <span className="hidden text-xs font-bold text-gray-700 sm:inline">
                {merchantProfile.shopName}
              </span>
              {merchantProfile.avatarUrl ? (
                <img
                  src={merchantProfile.avatarUrl}
                  alt={`${merchantProfile.shopName} logo`}
                  className="w-8 h-8 rounded-full border border-orange-200 object-cover bg-orange-50"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-orange-100 border border-orange-200 flex items-center justify-center text-[#FF851B] font-bold text-xs">
                  {merchantProfile.initials}
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-grow p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#003366]/60 backdrop-blur-md"
            onClick={() => !isLoggingOut && setShowLogoutModal(false)}
          ></div>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm relative z-10 overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 text-center">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${isLoggingOut ? "bg-orange-50" : "bg-red-50"}`}
              >
                {isLoggingOut ? (
                  <div className="w-8 h-8 border-4 border-[#FF851B] border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <AlertCircle size={32} className="text-red-500" />
                )}
              </div>
              <h3 className="text-lg font-bold text-[#003366] mb-2">
                {isLoggingOut ? "Logging out..." : "Confirm log out"}
              </h3>
              <p className="text-gray-400 text-xs mb-8 leading-relaxed">
                Are you sure you want to exit the Merchant Portal?
              </p>
              {!isLoggingOut && (
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleConfirmLogout}
                    className="w-full bg-[#003366] text-white py-3.5 rounded-xl font-bold text-xs shadow-md"
                  >
                    Yes, log out
                  </button>
                  <button
                    onClick={() => setShowLogoutModal(false)}
                    className="w-full bg-white text-gray-500 py-3 rounded-xl font-bold text-xs border border-gray-100"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
            <div
              className={`h-1.5 w-full transition-colors ${isLoggingOut ? "bg-[#FF851B]" : "bg-red-500"}`}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}
