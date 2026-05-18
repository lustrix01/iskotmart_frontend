import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, Heart, ShoppingCart, User, Mail } from "lucide-react";
import { useAuth } from "../context/useAuth";
import { useCart } from "../context/useCart";

const FALLBACK_AVATAR = "/placeholders/avatar.svg";

const formatBadgeCount = (count) => {
  const value = Number(count || 0);
  return value > 99 ? "99+" : String(value);
};

function Badge({ count }) {
  if (Number(count || 0) <= 0) return null;
  return (
    <span className="absolute -top-2 -right-2 min-w-5 rounded-full bg-[#FF851B] px-1.5 py-0.5 text-center text-[10px] font-semibold leading-none text-white">
      {formatBadgeCount(count)}
    </span>
  );
}

export default function Navbar() {
  const { user } = useAuth();
  const { productItems, serviceItems } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [profileSummary, setProfileSummary] = useState({
    userId: null,
    name: "",
    avatarUrl: "",
  });
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
    unsupported: {
      messages: "/",
      wishlist: "/products",
      cart: "/",
      profile: "/",
    },
  };

  const links = navByRole[role] || (user ? navByRole.unsupported : navByRole.guest);
  const cartCount = useMemo(
    () =>
      [...productItems, ...serviceItems].reduce(
        (sum, item) => sum + Number(item.qty || 1),
        0,
      ),
    [productItems, serviceItems],
  );
  const visibleUnreadMessages =
    user && ["customer", "merchant"].includes(role) ? unreadMessages : 0;
  const activeProfileSummary = profileSummary.userId === user?.id ? profileSummary : null;
  const profileLabel = user
    ? activeProfileSummary?.name || user.name || "My Profile"
    : "Sign in";
  const profileAvatarUrl = activeProfileSummary?.avatarUrl || user?.avatarUrl || "";

  const guestLink = (path) =>
    user ? { to: path } : { to: "/login", state: { from: { pathname: path } } };

  useEffect(() => {
    if (!user || !["customer", "merchant"].includes(role)) {
      return;
    }

    let isMounted = true;
    const loadCounts = async () => {
      try {
        const response = await fetch("/api/nav_counts.php", {
          credentials: "include",
        });
        const payload = await response.json().catch(() => ({}));
        if (response.ok && isMounted) {
          setUnreadMessages(Number(payload.unreadMessages || 0));
        }
      } catch {
        if (isMounted) {
          setUnreadMessages(0);
        }
      }
    };

    loadCounts();
    return () => {
      isMounted = false;
    };
  }, [role, user]);

  useEffect(() => {
    if (!user || role !== "customer") {
      return undefined;
    }

    let isMounted = true;
    const loadProfileSummary = async () => {
      try {
        const response = await fetch("/api/profile.php", {
          credentials: "include",
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !isMounted || !payload.profile) {
          return;
        }
        setProfileSummary({
          userId: user.id,
          name: payload.profile.displayName || payload.profile.name || user.name || "My Profile",
          avatarUrl: payload.profile.avatarUrl || "",
        });
      } catch {
        // Keep the session payload if the profile endpoint is unavailable.
      }
    };

    const handleProfileUpdate = (event) => {
      const profile = event.detail || {};
      setProfileSummary((current) => ({
        userId: user.id,
        name: profile.displayName || profile.name || current.name,
        avatarUrl: profile.avatarUrl || current.avatarUrl,
      }));
    };

    loadProfileSummary();
    window.addEventListener("iskomart:customer-profile-updated", handleProfileUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener("iskomart:customer-profile-updated", handleProfileUpdate);
    };
  }, [role, user]);

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
            <Badge count={visibleUnreadMessages} />
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
            {role === "customer" ? <Badge count={cartCount} /> : null}
          </Link>

          {/* My profile - Permanent link, Title Case, Removed extra boldness and italics */}
          <Link
            to={links.profile}
            state={user ? undefined : { from: location }}
            className="flex items-center gap-2 hover:text-[#FF851B] transition-colors ml-2 border-l border-white/20 pl-4"
          >
            {user && profileAvatarUrl ? (
              <img
                src={profileAvatarUrl}
                alt={`${profileLabel} profile`}
                className="h-8 w-8 rounded-full border border-white/40 bg-white/10 object-cover"
                onError={(event) => {
                  event.currentTarget.src = FALLBACK_AVATAR;
                }}
              />
            ) : (
              <div className="border border-white/40 rounded-full p-1.5">
                <User size={16} />
              </div>
            )}
            <span className="text-sm font-semibold tracking-normal">
              {user ? "My Profile" : profileLabel}
            </span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
