import React, { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  User,
  MapPin,
  Lock,
  Package,
  MessageCircle,
  Sliders,
  Heart,
  LogOut as LogOutIcon,
  AlertCircle,
  ArrowLeft, // Added the Arrow icon for the back button
} from "lucide-react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

export default function ProfileLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const menuItems = [
    { name: "Profile information", path: "/profile", icon: User },
    { name: "My addresses", path: "/profile/addresses", icon: MapPin },
    { name: "Change password", path: "/profile/password", icon: Lock },
    { name: "My orders", path: "/profile/orders", icon: Package },
    { name: "Wishlist", path: "/profile/wishlist", icon: Heart },
    { name: "Messages", path: "/profile/messages", icon: MessageCircle },
    { name: "Preferences", path: "/profile/preferences", icon: Sliders },
  ];

  const handleConfirmLogout = () => {
    setIsLoggingOut(true);

    setTimeout(() => {
      // Clear the session via context
      if (logout) {
        logout();
      }

      // Force a hard redirect to override any built-in AuthContext routing
      window.location.href = "/login";
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#F5F7F9] font-sans">
      <Navbar />

      <div className="flex">
        {/* SIDEBAR */}
        <aside className="w-64 bg-[#003366] text-white fixed h-[calc(100vh-64px)] top-16 left-0 z-40 flex flex-col justify-between border-r border-white/5 shadow-lg">
          <div className="p-4">
            {/* NEW: Back to Store Button */}
            <Link
              to="/"
              className="flex items-center gap-3 px-4 py-2.5 mb-6 rounded-md text-sm font-bold text-[#FF851B] bg-[#FF851B]/10 hover:bg-[#FF851B]/20 transition-all border border-[#FF851B]/20"
            >
              <ArrowLeft size={16} />
              <span>Back to store</span>
            </Link>

            <p className="text-gray-400 text-[10px] font-bold tracking-widest uppercase mb-4 opacity-50 px-4">
              Account settings
            </p>
            <nav className="space-y-0.5">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-md text-sm transition-all group ${
                      isActive
                        ? "bg-white/10 text-white border-l-4 border-[#FF851B]"
                        : "text-gray-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <item.icon
                      size={16}
                      className={
                        isActive
                          ? "text-[#FF851B]"
                          : "text-gray-400 group-hover:text-white"
                      }
                    />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="p-4 border-t border-white/10">
            <button
              onClick={() => setShowLogoutModal(true)}
              className="flex items-center gap-3 text-gray-400 hover:text-red-400 transition-colors text-sm font-medium w-full px-4 py-2.5 group"
            >
              <LogOutIcon size={16} />
              <span>Log out</span>
            </button>
          </div>
        </aside>

        {/* CONTENT AREA */}
        <main className="flex-grow ml-64 pt-4 px-8 pb-10 mt-16">
          <Outlet />
        </main>
      </div>

      {/* --- LOGOUT CONFIRMATION MODAL --- */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#003366]/40 backdrop-blur-md animate-in fade-in"
            onClick={() => !isLoggingOut && setShowLogoutModal(false)}
          ></div>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm relative z-10 overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 text-center">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${
                  isLoggingOut ? "bg-orange-50" : "bg-red-50"
                }`}
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
                {isLoggingOut
                  ? "Ending your session securely."
                  : "Are you sure you want to log out of IskoMart?"}
              </p>

              {isLoggingOut && (
                <div className="bg-[#F8FAFC] rounded-xl p-4 mb-8 border border-gray-100 text-left">
                  <p className="text-[9px] font-bold tracking-widest uppercase opacity-40 mb-1">
                    Action taken
                  </p>
                  <p className="text-[10px] font-medium text-[#003366]">
                    Clearing Session - Invalidating Token - Redirecting to Login
                  </p>
                </div>
              )}

              {!isLoggingOut && (
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleConfirmLogout}
                    className="w-full bg-[#003366] text-white py-3.5 rounded-xl font-bold text-xs shadow-md active:scale-95 transition-all"
                  >
                    Yes, log out
                  </button>
                  <button
                    onClick={() => setShowLogoutModal(false)}
                    className="w-full bg-white text-gray-500 py-3 rounded-xl font-bold text-xs border border-gray-100 hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
            <div
              className={`h-1.5 w-full transition-colors ${
                isLoggingOut ? "bg-[#FF851B]" : "bg-red-500"
              }`}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}
