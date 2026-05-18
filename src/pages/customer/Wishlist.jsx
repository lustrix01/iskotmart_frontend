import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronRight,
  Clock,
  Heart,
  ShoppingBag,
  ShoppingCart,
  Star,
  Store,
  Trash2,
  Wrench,
  Zap,
} from "lucide-react";
import { useCart } from "../../context/useCart";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?q=80&w=400&auto=format&fit=crop";

function formatAddedOn(value) {
  if (!value) {
    return "Recently added";
  }

  const date = new Date(value.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) {
    return "Recently added";
  }

  return `Added on ${date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}

export default function Wishlist() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const showNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2500);
  };

  useEffect(() => {
    let isMounted = true;

    const loadWishlist = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await fetch("/api/customer_wishlist.php", {
          credentials: "include",
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload.error || "Unable to load wishlist.");
        }

        if (isMounted) {
          setWishlistItems(Array.isArray(payload.items) ? payload.items : []);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message);
          setWishlistItems([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadWishlist();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleRemove = async (item) => {
    try {
      const response = await fetch("/api/customer_wishlist.php", {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offeringId: Number(item.id) }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Unable to remove item.");
      }

      setWishlistItems(Array.isArray(payload.items) ? payload.items : []);
      showNotice("Removed from wishlist.");
    } catch (removeError) {
      showNotice(removeError.message);
    }
  };

  const handleAddToCart = (item) => {
    const image = item.img || item.images?.[0]?.url || FALLBACK_IMAGE;
    addToCart(
      item.type,
      {
        id: Number(item.id),
        name: item.name,
        img: image,
        price: Number(item.price || 0),
        merchantId: Number(item.merchantId || 0),
        merchant: item.merchant || "Merchant",
        category: item.category || "",
        rateType: item.rateType || "",
      },
      1,
    );
    showNotice(item.type === "service" ? "Added to bookings." : "Added to cart.");
  };

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-500">
      {notice ? (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#003366] text-white px-5 py-2 rounded-md text-xs font-bold">
          {notice}
        </div>
      ) : null}

      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#003366]">My wishlist</h1>
        <p className="text-xs text-gray-400 mt-1">
          Products and services you saved for later.
        </p>
      </div>

      {loading ? (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-10 text-center">
          <p className="text-sm font-bold text-[#003366]">Loading wishlist...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-100 rounded-xl p-10 text-center">
          <p className="text-sm font-bold text-red-600">{error}</p>
        </div>
      ) : wishlistItems.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-10 text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-[#F8FAFC] border border-gray-100 flex items-center justify-center mb-4">
            <Heart size={24} className="text-[#FF851B]" />
          </div>
          <h2 className="text-base font-bold text-[#003366]">Your wishlist is empty</h2>
          <p className="text-xs text-gray-500 mt-2 max-w-md mx-auto">
            Start browsing the catalog and save items to track products and services you want to buy or book.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#003366] text-white text-xs font-bold rounded-md hover:bg-[#002244] transition-colors"
            >
              <ShoppingBag size={14} />
              Browse Products
              <ChevronRight size={14} />
            </Link>
            <Link
              to="/services"
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-200 text-[#003366] text-xs font-bold rounded-md hover:bg-gray-50 transition-colors"
            >
              <Wrench size={14} />
              Browse Services
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {wishlistItems.map((item) => {
            const isService = item.type === "service";
            const detailPath = isService ? `/service/${item.id}` : `/product/${item.id}`;
            const image = item.img || item.images?.[0]?.url || FALLBACK_IMAGE;
            const availability = isService
              ? "Available for booking"
              : Number(item.stock || 0) <= 5
                ? `Low stock (${Number(item.stock || 0)} left)`
                : `${Number(item.stock || 0)} in stock`;

            return (
              <div
                key={`${item.type}-${item.id}`}
                className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden transition-all hover:shadow-md hover:border-gray-200"
              >
                <div className="p-6 flex flex-col md:flex-row gap-8">
                  <div className="relative shrink-0">
                    <div className="w-24 h-24 rounded-lg border border-gray-100 overflow-hidden bg-gray-50 shadow-sm">
                      <img
                        src={image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(event) => {
                          event.currentTarget.src = FALLBACK_IMAGE;
                        }}
                      />
                    </div>
                    <div className="absolute -top-2 -left-2 bg-white shadow-md rounded-full p-1.5 border border-gray-100">
                      {isService ? (
                        <Wrench size={12} className="text-[#0074D9]" />
                      ) : (
                        <ShoppingBag size={12} className="text-[#FF851B]" />
                      )}
                    </div>
                  </div>

                  <div className="flex-grow min-w-0 flex flex-col justify-center">
                    <div className="flex justify-between items-start mb-1 gap-3">
                      <Link
                        to={item.merchantId ? `/merchant/${item.merchantId}` : detailPath}
                        className="flex items-center gap-2 min-w-0"
                      >
                        <Store size={14} className="text-gray-300 shrink-0" />
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">
                          {item.merchant}
                        </span>
                      </Link>
                      <div className="flex items-center gap-1 text-[#FF851B]">
                        <Star size={12} fill="#FF851B" />
                        <span className="text-xs font-bold">
                          {Number(item.rating || 0).toFixed(1)}
                        </span>
                      </div>
                    </div>

                    <Link to={detailPath} className="text-lg font-bold text-gray-800 mb-2 truncate hover:text-[#003366]">
                      {item.name}
                    </Link>

                    <div className="flex flex-wrap gap-4">
                      <span className="text-xl font-bold text-[#FF851B]">
                        PHP {Number(item.price || 0).toFixed(2)}
                      </span>
                      <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-medium">
                        <Clock size={12} />
                        <span>{isService ? item.rateType : item.category}</span>
                      </div>
                    </div>
                  </div>

                  <div className="md:w-64 bg-[#F8FAFC] rounded-lg p-4 flex flex-col justify-center border border-gray-50">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[#003366]">
                        <Zap size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">
                          Availability
                        </span>
                      </div>
                      <p
                        className={`text-[11px] font-bold ${
                          availability.includes("Low") ? "text-red-500" : "text-green-600"
                        }`}
                      >
                        {availability}
                      </p>
                      <p className="text-[10px] text-gray-400 leading-relaxed">
                        {formatAddedOn(item.addedOn)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 bg-gray-50/10 border-t border-gray-50 flex flex-col sm:flex-row justify-between gap-3 sm:items-center">
                  <button
                    onClick={() => handleRemove(item)}
                    className="flex items-center gap-2 text-[11px] font-bold text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={14} />
                    Remove from wishlist
                  </button>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => navigate(detailPath)}
                      className="px-6 py-2 border border-gray-200 text-[#003366] text-xs font-bold rounded-md hover:bg-gray-50 transition-colors"
                    >
                      View details
                    </button>
                    <button
                      onClick={() => handleAddToCart(item)}
                      className="px-6 py-2 bg-[#FF851B] text-white text-xs font-bold rounded-md hover:bg-[#E67616] transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
                    >
                      {isService ? <Zap size={14} /> : <ShoppingCart size={14} />}
                      {isService ? "Book now" : "Add to cart"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
