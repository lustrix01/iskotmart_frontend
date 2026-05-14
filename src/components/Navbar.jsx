import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, Heart, ShoppingCart, User, Mail } from "lucide-react";
import { useAuth } from "../context/useAuth";

export default function Navbar() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const role = user?.role || "guest";

  const navByRole = {
    guest: {
      messages: "/profile/messages",
      wishlist: "/profile/wishlist",
      cart: "/cart",
      profile: "/login",
    },
    customer: {
      messages: "/profile/messages",
      wishlist: "/profile/wishlist",
      cart: "/cart",
      profile: "/profile",
    },
    merchant: {
      messages: "/merchant/messages",
      wishlist: "/merchant/products",
      cart: "/merchant/orders",
      profile: "/merchant",
    },
    moderator: {
      messages: "/moderator",
      wishlist: "/moderator/listings",
      cart: "/moderator/reports",
      profile: "/moderator",
    },
    admin: {
      messages: "/admin/reports",
      wishlist: "/admin/listings",
      cart: "/admin/logs",
      profile: "/admin",
    },
  };

  const links = navByRole[role] || navByRole.guest;

  const guestLink = (path) =>
    user ? { to: path } : { to: "/login", state: { from: { pathname: path } } };

  const handleSearch = (event) => {
    event.preventDefault();

    const params = new URLSearchParams();
    const query = searchQuery.trim();

    if (query) {
      params.set("q", query);
    }

    navigate(params.toString() ? `/search?${params.toString()}` : "/search");
  };

  return (
    <nav className="bg-[#003366] text-white shadow-md sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-4 py-3 md:py-0 md:h-16 flex flex-wrap md:flex-nowrap items-center justify-between gap-3 md:gap-6 font-sans">
        {/* Logo - Kept bold for branding but removed black/heavy weights */}
        <Link
          to="/"
          className="text-2xl font-bold tracking-tight flex-shrink-0"
        >
          <span className="text-[#0074D9]">Isko</span>
          <span className="text-[#FF851B]">Mart</span>
        </Link>

        {/* Search Bar - Standard Title Case Placeholder */}
        <form
          onSubmit={handleSearch}
          className="order-3 md:order-none basis-full md:basis-auto flex-grow max-w-full md:max-w-2xl flex items-center"
        >
          <div className="relative w-full flex shadow-sm">
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search for products, brands and more..."
              className="w-full py-2 px-4 rounded-l-sm text-gray-800 focus:outline-none text-sm bg-white"
            />
            <button
              type="submit"
              className="bg-[#FF851B] px-4 rounded-r-sm hover:bg-[#e67616] transition-colors border-l border-gray-100"
            >
              <Search size={18} className="text-white" strokeWidth={2.5} />
            </button>
          </div>
        </form>

        {/* Action Icons - Using font-semibold for clean numbers */}
        <div className="flex items-center gap-4 md:gap-5 text-sm font-medium">
          {/* Messages Link */}
          <Link
            {...guestLink(links.messages)}
            className="flex items-center gap-1 hover:text-[#FF851B] transition-colors relative"
            aria-label="Messages"
          >
            <Mail size={20} />
          </Link>

          {/* Wishlist Link */}
          <Link
            {...guestLink(links.wishlist)}
            className="flex items-center gap-1 hover:text-[#FF851B] transition-colors relative"
            aria-label="Wishlist"
          >
            <Heart size={20} />
          </Link>

          <Link
            {...guestLink(links.cart)}
            className="flex items-center gap-1 hover:text-[#FF851B] transition-colors relative"
            aria-label="Cart"
          >
            <ShoppingCart size={20} />
          </Link>

          {/* My profile - Permanent link, Title Case, Removed extra boldness and italics */}
          <Link
            to={links.profile}
            state={user ? undefined : { from: location }}
            className="flex items-center gap-2 hover:text-[#FF851B] transition-colors ml-2 border-l border-white/20 pl-4"
          >
            <div className="border border-white/40 rounded-full p-1.5">
              <User size={16} />
            </div>
            <span className="text-sm font-semibold tracking-normal">
              {user ? "My Profile" : "Sign in"}
            </span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
