import React, { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardList,
  PackageX,
  MessageSquareX,
  UserX,
  Star,
  LogOut as LogOutIcon,
  Bell,
  AlertCircle,
} from "lucide-react"; // FIXED: Changed from lucide-center to lucide-react
import { useAuth } from "../context/AuthContext";

export default function IskoModLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Moderator specific menu items
  const menuItems = [
    { name: "Dashboard", path: "/moderator", icon: LayoutDashboard },
    { name: "Report Logs", path: "/moderator/reports", icon: ClipboardList },
    {
      name: "Deactivate Listings",
      path: "/moderator/listings",
      icon: PackageX,
    },
    {
      name: "Remove Reviews",
      path: "/moderator/reviews",
      icon: MessageSquareX,
    },
    { name: "Account Moderation", path: "/moderator/accounts", icon: UserX },
    { name: "Feature Products", path: "/moderator/promotions", icon: Star },
  ];

  const handleConfirmLogout = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      if (logout) logout();
      window.location.href = "/login";
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#F5F7F9] font-sans flex text-[#003366]">
      {/* SIDEBAR - 100% Admin Matching Design */}
      <aside className="w-64 bg-[#003366] text-white fixed h-screen top-0 left-0 z-40 flex flex-col justify-between shadow-xl">
        <div>
          {/* Header/Logo - IskoMod with Orange accent */}
          <div className="h-16 flex items-center justify-center border-b border-white/10 bg-[#002244]">
            <Link to="/moderator" className="text-2xl font-bold tracking-tight">
              <span className="text-[#0074D9]">Isko</span>
              <span className="text-[#FF851B]">Mod</span>
            </Link>
          </div>

          <div className="p-4 mt-2 overflow-y-auto max-h-[calc(100vh-140px)] custom-scrollbar">
            <p className="text-gray-400 text-[10px] font-black tracking-widest uppercase mb-4 opacity-50 px-4">
              Safety & Content
            </p>
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const isActive =
                  item.path === "/moderator"
                    ? location.pathname === "/moderator"
                    : location.pathname.startsWith(item.path);

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-xs transition-all group ${
                      isActive
                        ? "bg-white/10 text-white border-l-4 border-[#FF851B] font-black"
                        : "text-gray-300 font-bold hover:bg-white/5 hover:text-white"
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

        {/* Bottom Logout Section */}
        <div className="p-4 border-t border-white/10 bg-[#002244]/50">
          <button
            onClick={() => setShowLogoutModal(true)}
            className="flex items-center gap-3 text-gray-400 hover:text-red-400 transition-colors text-xs font-black w-full px-4 py-3 group rounded-lg hover:bg-white/5"
          >
            <LogOutIcon size={18} />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-grow ml-64 min-h-screen flex flex-col">
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-30 shadow-sm">
          <h1 className="text-sm font-black text-[#003366] uppercase tracking-wider">
            {menuItems.find((m) => m.path === location.pathname)?.name ||
              "Dashboard"}
          </h1>

          <div className="flex items-center gap-3">
            <button className="w-10 h-10 flex items-center justify-center border border-gray-100 rounded-full hover:bg-gray-50 transition-colors relative">
              <Bell size={18} className="text-gray-500" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-2 pl-3 border-l border-gray-100">
              <div className="text-right">
                <p className="text-[10px] font-black text-[#003366] uppercase leading-none">
                  Safety Moderator
                </p>
                <p className="text-[9px] font-bold text-[#FF851B] uppercase tracking-tighter mt-1">
                  Online / Active
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#003366] text-white flex items-center justify-center font-black text-xs border-2 border-white shadow-sm">
                MD
              </div>
            </div>
          </div>
        </header>

        {/* Content goes here */}
        <div className="p-8 flex-grow">
          <Outlet />
        </div>
      </main>

      {/* LOGOUT MODAL */}
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
              <h3 className="text-lg font-black text-[#003366] mb-2">
                {isLoggingOut ? "Logging out..." : "Confirm log out"}
              </h3>
              <p className="text-gray-400 text-xs mb-8">
                Are you sure you want to exit the Moderator Console?
              </p>
              {!isLoggingOut && (
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleConfirmLogout}
                    className="w-full bg-[#003366] text-white py-3.5 rounded-xl font-black text-xs shadow-md"
                  >
                    Yes, log out
                  </button>
                  <button
                    onClick={() => setShowLogoutModal(false)}
                    className="w-full bg-white text-gray-500 py-3 rounded-xl font-black text-xs border border-gray-100"
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
