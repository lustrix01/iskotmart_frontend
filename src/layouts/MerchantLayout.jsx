import React, { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Settings,
  Package,
  ShoppingCart,
  MessageSquare,
  Tag,
  TrendingUp,
  DollarSign,
  LogOut as LogOutIcon,
  AlertCircle,
  Bell,
  CreditCard, // New Icon for Subscriptions
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function MerchantLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const menuItems = [
    { name: "Dashboard", path: "/merchant", icon: LayoutDashboard },
    { name: "Shop Settings", path: "/merchant/settings", icon: Settings },
    { name: "Products/Services", path: "/merchant/products", icon: Package },
    { name: "Orders", path: "/merchant/orders", icon: ShoppingCart },
    { name: "Messages", path: "/merchant/messages", icon: MessageSquare },
    {
      name: "Subscriptions",
      path: "/merchant/subscriptions",
      icon: CreditCard,
    }, // ADDED HERE
    { name: "Discount and Voucher", path: "/merchant/discounts", icon: Tag },
    { name: "Analytics", path: "/merchant/analytics", icon: TrendingUp },
    { name: "Earnings", path: "/merchant/earnings", icon: DollarSign },
  ];

  const handleConfirmLogout = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      if (logout) logout();
      window.location.href = "/login";
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#F5F7F9] font-sans flex">
      <aside className="w-64 bg-[#003366] text-white fixed h-screen top-0 left-0 z-40 flex flex-col justify-between shadow-xl">
        <div>
          <div className="h-16 flex items-center justify-center border-b border-white/10 bg-[#002244]">
            <Link to="/merchant" className="text-2xl font-bold tracking-tight">
              <span className="text-[#0074D9]">Isko</span>
              <span className="text-[#FF851B]">Mart</span>
            </Link>
          </div>

          <div className="p-4 mt-2 overflow-y-auto max-h-[calc(100vh-140px)] custom-scrollbar">
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

      <main className="flex-grow ml-64 min-h-screen flex flex-col">
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-30 shadow-sm">
          <h1 className="text-lg font-bold text-[#003366] capitalize">
            {menuItems.find((m) => m.path === location.pathname)?.name ||
              "Dashboard"}
          </h1>
          <div className="flex items-center gap-3">
            <button className="w-10 h-10 flex items-center justify-center border border-gray-100 rounded-full hover:bg-gray-50 transition-colors relative">
              <Bell size={18} className="text-gray-500" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-2 pl-3 border-l border-gray-100">
              <span className="text-xs font-bold text-gray-700">
                TechHub Electronics
              </span>
              <div className="w-8 h-8 rounded-full bg-orange-100 border border-orange-200 flex items-center justify-center text-[#FF851B] font-bold text-xs">
                TH
              </div>
            </div>
          </div>
        </header>

        <div className="p-8 flex-grow">
          <Outlet />
        </div>
      </main>

      {/* Logout Modal remains the same... */}
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
