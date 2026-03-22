import { Link } from "react-router-dom";
import { Search, Heart, ShoppingCart, User, Mail } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user } = useAuth();

  return (
    <nav className="bg-[#003366] text-white shadow-md sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-4 h-16 flex items-center justify-between gap-6 font-sans">
        {/* Logo - Kept bold for branding but removed black/heavy weights */}
        <Link
          to="/"
          className="text-2xl font-bold tracking-tight flex-shrink-0"
        >
          <span className="text-[#0074D9]">Isko</span>
          <span className="text-[#FF851B]">Mart</span>
        </Link>

        {/* Search Bar - Standard Title Case Placeholder */}
        <div className="flex-grow max-w-2xl flex items-center">
          <div className="relative w-full flex shadow-sm">
            <input
              type="text"
              placeholder="Search for products, brands and more..."
              className="w-full py-2 px-4 rounded-l-sm text-gray-800 focus:outline-none text-sm bg-white"
            />
            <button className="bg-[#FF851B] px-4 rounded-r-sm hover:bg-[#e67616] transition-colors border-l border-gray-100">
              <Search size={18} className="text-white" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Action Icons - Using font-semibold for clean numbers */}
        <div className="flex items-center gap-5 text-sm font-medium">
          {/* Messages Link */}
          <Link
            to="/profile/messages"
            className="flex items-center gap-1 hover:text-[#FF851B] transition-colors relative"
          >
            <Mail size={20} />
            <span className="absolute -top-2 -right-2 bg-[#FF851B] text-[10px] text-white rounded-full px-1.5 font-semibold">
              3
            </span>
          </Link>

          {/* Wishlist Link */}
          <Link
            to="/profile/wishlist"
            className="flex items-center gap-1 hover:text-[#FF851B] transition-colors relative"
          >
            <Heart size={20} />
            <span className="absolute -top-2 -right-2 bg-[#FF851B] text-[10px] text-white rounded-full px-1.5 font-semibold">
              0
            </span>
          </Link>

          <Link
            to="/cart"
            className="flex items-center gap-1 hover:text-[#FF851B] transition-colors relative"
          >
            <ShoppingCart size={20} />
            <span className="absolute -top-2 -right-2 bg-[#FF851B] text-[10px] text-white rounded-full px-1.5 font-semibold">
              5
            </span>
          </Link>

          {/* My profile - Permanent link, Title Case, Removed extra boldness and italics */}
          <Link
            to="/profile"
            className="flex items-center gap-2 hover:text-[#FF851B] transition-colors ml-2 border-l border-white/20 pl-4"
          >
            <div className="border border-white/40 rounded-full p-1.5">
              <User size={16} />
            </div>
            <span className="text-sm font-semibold tracking-normal">
              My profile
            </span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
