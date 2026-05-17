import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Heart,
  Info,
  MessageCircle,
  Minus,
  Plus,
  ShoppingCart,
  Star,
  Store,
} from "lucide-react";
import { useAuth } from "../../context/useAuth";
import { useCart } from "../../context/useCart";
import { useStorefrontListings } from "../../data/storefrontData";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?q=80&w=800&auto=format&fit=crop";

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { products, services, loading, error } = useStorefrontListings();

  const isServiceRoute = location.pathname.startsWith("/service/");
  const [quantity, setQuantity] = useState(1);
  const [selectedImg, setSelectedImg] = useState(0);
  const [notification, setNotification] = useState("");
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [messageLoading, setMessageLoading] = useState(false);
  const [reviewSummary, setReviewSummary] = useState({
    average: null,
    count: 0,
    reviews: [],
  });

  const item = useMemo(() => {
    const targetId = Number(id);
    if (!Number.isFinite(targetId)) {
      return null;
    }

    const pool = isServiceRoute ? services : products;
    return pool.find((entry) => Number(entry.id) === targetId) || null;
  }, [id, isServiceRoute, products, services]);

  const imageUrls = useMemo(() => {
    if (!item) {
      return [FALLBACK_IMAGE];
    }

    const urls = Array.isArray(item.images)
      ? item.images.map((img) => img?.url).filter(Boolean)
      : [];

    if (item.img) {
      urls.unshift(item.img);
    }

    const unique = Array.from(new Set(urls));
    return unique.length > 0 ? unique : [FALLBACK_IMAGE];
  }, [item]);

  const maxQty = Math.max(1, Number(item?.stock ?? 1));
  const description = String(item?.description || "").trim();
  const shouldClampDescription = description.length > 220;
  const visibleDescription =
    shouldClampDescription && !isDescriptionExpanded
      ? `${description.slice(0, 220).trim()}...`
      : description;

  useEffect(() => {
    setSelectedImg(0);
    setIsDescriptionExpanded(false);
  }, [id, isServiceRoute]);

  useEffect(() => {
    let isMounted = true;

    const loadReviews = async () => {
      if (!item?.id) {
        setReviewSummary({ average: null, count: 0, reviews: [] });
        return;
      }

      try {
        const response = await fetch(
          `/api/offering_reviews.php?offeringId=${encodeURIComponent(item.id)}`,
          { credentials: "include" },
        );
        const payload = await response.json().catch(() => ({}));
        if (response.ok && isMounted) {
          setReviewSummary({
            average: payload.average ?? null,
            count: payload.count || 0,
            reviews: Array.isArray(payload.reviews) ? payload.reviews : [],
          });
        }
      } catch {
        if (isMounted) {
          setReviewSummary({ average: null, count: 0, reviews: [] });
        }
      }
    };

    loadReviews();
    return () => {
      isMounted = false;
    };
  }, [item]);

  useEffect(() => {
    let isMounted = true;

    const loadWishlistState = async () => {
      if (!user || !item) {
        setIsWishlisted(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/customer_wishlist.php?offeringId=${encodeURIComponent(item.id)}`,
          { credentials: "include" },
        );
        const payload = await response.json().catch(() => ({}));
        if (response.ok && isMounted) {
          setIsWishlisted(Boolean(payload.wishlisted));
        }
      } catch {
        if (isMounted) {
          setIsWishlisted(false);
        }
      }
    };

    loadWishlistState();
    return () => {
      isMounted = false;
    };
  }, [item, user]);

  const showToast = (message) => {
    setNotification(message);
    window.setTimeout(() => setNotification(""), 2500);
  };

  const goToLogin = () => {
    navigate("/login", { state: { from: location } });
  };

  const handleAddToCart = () => {
    if (!user) {
      goToLogin();
      return;
    }
    if (!item) {
      return;
    }

    const cartType = isServiceRoute ? "service" : "product";
    addToCart(
      cartType,
      {
        id: Number(item.id),
        name: item.name,
        img: imageUrls[0],
        price: Number(item.price || 0),
        merchant: item.merchant || "Merchant",
        category: item.category || "",
        rateType: item.rateType || "",
      },
      quantity,
    );
    showToast(`${quantity} ${isServiceRoute ? "booking" : "item"}${quantity > 1 ? "s" : ""} added.`);
  };

  const handleBuyNow = () => {
    if (!user) {
      goToLogin();
      return;
    }

    if (!item) {
      return;
    }

    navigate(`/checkout?type=${item.type}`, {
      state: {
        type: item.type,
        items: [
          {
            id: Number(item.id),
            name: item.name,
            img: imageUrls[0],
            price: Number(item.price || 0),
            qty: quantity,
            merchant: item.merchant,
          },
        ],
      },
    });
  };

  const handleToggleWishlist = async () => {
    if (!user) {
      goToLogin();
      return;
    }
    if (!item || wishlistLoading) {
      return;
    }

    setWishlistLoading(true);
    try {
      const response = await fetch("/api/customer_wishlist.php", {
        method: isWishlisted ? "DELETE" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offeringId: Number(item.id) }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Unable to update wishlist.");
      }
      setIsWishlisted(Boolean(payload.wishlisted));
      showToast(payload.wishlisted ? "Added to wishlist." : "Removed from wishlist.");
    } catch (wishlistError) {
      showToast(wishlistError.message);
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleMessageMerchant = async () => {
    if (!user) {
      goToLogin();
      return;
    }
    if (!item?.merchantId || messageLoading) {
      showToast("Merchant contact is unavailable.");
      return;
    }

    setMessageLoading(true);
    try {
      const response = await fetch("/api/customer_messages.php", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchantId: Number(item.merchantId),
          message: `Hi, I am interested in ${item.name}.`,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Unable to message merchant.");
      }
      navigate("/profile/messages");
    } catch (messageError) {
      showToast(messageError.message);
    } finally {
      setMessageLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-[1100px] mx-auto p-6">
        <div className="bg-white border border-gray-100 rounded-xl p-10 text-center">
          <p className="text-sm font-bold text-[#003366]">Loading details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-[1100px] mx-auto p-6">
        <div className="bg-red-50 border border-red-100 rounded-xl p-10 text-center">
          <p className="text-sm font-bold text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="max-w-[1100px] mx-auto p-6 space-y-4">
        <div className="text-xs text-gray-400">
          <Link to="/" className="hover:text-[#003366]">
            Home
          </Link>{" "}
          / {isServiceRoute ? "Services" : "Products"}
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-10 text-center">
          <p className="text-sm font-bold text-[#003366]">This listing is unavailable.</p>
          <p className="mt-2 text-xs text-gray-400">
            It may have been removed or is no longer active.
          </p>
          <Link
            to={isServiceRoute ? "/services" : "/products"}
            className="inline-block mt-6 px-6 py-2 border border-[#FF851B] text-[#FF851B] text-xs font-bold rounded-md hover:bg-[#FF851B] hover:text-white transition-all"
          >
            Back to {isServiceRoute ? "services" : "products"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1100px] mx-auto p-6 space-y-5">
      {notification ? (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#003366] text-white px-5 py-2 rounded-md text-xs font-bold">
          {notification}
        </div>
      ) : null}

      <div className="text-xs text-gray-400">
        <Link to="/" className="hover:text-[#003366]">
          Home
        </Link>{" "}
        /{" "}
        <Link to={isServiceRoute ? "/services" : "/products"} className="hover:text-[#003366]">
          {isServiceRoute ? "Services" : "Products"}
        </Link>{" "}
        / <span className="text-[#003366]">{item.name}</span>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-3">
          <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden border border-gray-100 relative">
            <img src={imageUrls[selectedImg]} alt={item.name} className="w-full h-full object-cover" />
            {imageUrls.length > 1 ? (
              <>
                <button
                  onClick={() => setSelectedImg((prev) => (prev > 0 ? prev - 1 : imageUrls.length - 1))}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 p-1.5 rounded-full"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setSelectedImg((prev) => (prev < imageUrls.length - 1 ? prev + 1 : 0))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 p-1.5 rounded-full"
                >
                  <ChevronRight size={16} />
                </button>
              </>
            ) : null}
          </div>

          <div className="flex gap-2 overflow-x-auto">
            {imageUrls.map((url, idx) => (
              <button
                key={`${url}-${idx}`}
                onClick={() => setSelectedImg(idx)}
                className={`w-16 h-16 rounded-md overflow-hidden border ${selectedImg === idx ? "border-[#FF851B]" : "border-gray-100"}`}
              >
                <img src={url} alt={`${item.name} ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{item.category}</p>
          <h1 className="text-xl font-black text-[#003366]">{item.name}</h1>

          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="font-bold text-[#FF851B] flex items-center gap-1">
              <Star size={14} fill="#FF851B" stroke="none" />{" "}
              {reviewSummary.average !== null ? reviewSummary.average.toFixed(1) : "No ratings"}
            </span>
            <span>{reviewSummary.count} review{reviewSummary.count === 1 ? "" : "s"}</span>
            <span>Merchant: {item.merchant || "Merchant"}</span>
          </div>

          <div className="text-3xl font-black text-[#FF851B]">PHP {Number(item.price || 0).toFixed(2)}</div>

          <div className="text-xs text-gray-500">
            {isServiceRoute
              ? `Rate: ${item.rateType || "per project"}`
              : `${Number(item.stock || 0)} in stock`}
          </div>

          <div className="flex items-center gap-4 pt-1">
            <div className="flex items-center border border-gray-200 rounded-md overflow-hidden">
              <button
                onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                className="px-3 py-2 text-gray-500 hover:bg-gray-50"
              >
                <Minus size={14} />
              </button>
              <span className="px-4 text-sm font-bold min-w-10 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity((prev) => Math.min(maxQty, prev + 1))}
                className="px-3 py-2 text-gray-500 hover:bg-gray-50"
              >
                <Plus size={14} />
              </button>
            </div>
            {!isServiceRoute ? (
              <span className="text-[11px] text-gray-400">Max {maxQty}</span>
            ) : null}
          </div>

          <div className="pt-2 flex gap-3">
            <button
              onClick={handleAddToCart}
              className="flex-1 border-2 border-[#FF851B] text-[#FF851B] py-3 rounded-md text-xs font-black hover:bg-[#FF851B] hover:text-white transition-all flex items-center justify-center gap-2"
            >
              <ShoppingCart size={16} /> {isServiceRoute ? "Add to bookings" : "Add to cart"}
            </button>
            <button
              onClick={handleBuyNow}
              className="flex-1 bg-[#FF851B] text-white py-3 rounded-md text-xs font-black hover:bg-[#E67616] transition-all"
            >
              {isServiceRoute ? "Book now" : "Buy now"}
            </button>
            <button
              onClick={handleToggleWishlist}
              disabled={wishlistLoading}
              className={`w-16 border border-gray-200 rounded-md text-xs font-black flex flex-col items-center justify-center gap-1 transition-all ${
                isWishlisted
                  ? "text-red-500 bg-red-50 border-red-100"
                  : "text-gray-400 hover:text-red-500 hover:bg-red-50"
              }`}
              title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart size={18} className={isWishlisted ? "fill-current" : ""} />
              <span className="text-[9px]">Save</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-6">
        <h2 className="text-sm font-black text-[#003366] tracking-wider mb-4 flex items-center gap-2">
          <Info size={16} className="text-[#FF851B]" />
          Description
        </h2>
        {description ? (
          <>
            <p className="text-sm text-gray-600 leading-7 whitespace-pre-line">
              {visibleDescription}
            </p>
            {shouldClampDescription ? (
              <button
                onClick={() => setIsDescriptionExpanded((current) => !current)}
                className="mt-3 text-xs font-black text-[#FF851B] hover:underline"
              >
                {isDescriptionExpanded ? "Show less" : "Read more"}
              </button>
            ) : null}
          </>
        ) : (
          <p className="text-xs text-gray-400">No description provided yet.</p>
        )}
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-6 flex flex-col md:flex-row md:items-center gap-6">
        <div className="flex items-center gap-4 md:border-r md:pr-8 border-gray-100 shrink-0">
          <div className="relative">
            <div className="w-16 h-16 bg-[#F8FAFC] rounded-full flex items-center justify-center border border-gray-100">
              <Store size={24} className="text-[#003366]" />
            </div>
            <CheckCircle2
              size={20}
              className="absolute bottom-0 right-0 text-[#0074D9] bg-white rounded-full"
            />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Published by
            </p>
            <h3 className="font-black text-[#003366] text-base">
              {item.merchant || "Merchant"}
            </h3>
          </div>
        </div>
        <div className="flex-grow grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={handleMessageMerchant}
            disabled={messageLoading}
            className="flex items-center justify-center gap-2 text-[11px] font-black bg-[#FF851B]/10 text-[#FF851B] px-4 py-3 border border-[#FF851B]/20 hover:bg-[#FF851B] hover:text-white transition-all rounded-md"
          >
            <MessageCircle size={15} />
            {messageLoading ? "Opening..." : "Message merchant"}
          </button>
          <Link
            to={item.merchantId ? `/merchant/${item.merchantId}` : "#"}
            className="flex items-center justify-center gap-2 text-[11px] font-black border border-gray-200 text-[#003366] px-4 py-3 hover:border-[#003366] transition-all rounded-md"
          >
            <Store size={15} />
            View shop
          </Link>
          <div className="flex items-center justify-center gap-2 text-[11px] font-bold text-gray-500 bg-[#F8FAFC] border border-gray-100 rounded-md px-4 py-3">
            <Star size={14} fill="#FF851B" className="text-[#FF851B]" />
            {reviewSummary.average !== null ? reviewSummary.average.toFixed(1) : "No"} listing rating
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-6">
        <h2 className="text-sm font-black text-[#003366] tracking-wider mb-4 flex items-center gap-2">
          <Star size={16} className="text-[#FF851B]" fill="#FF851B" />
          Ratings and reviews
        </h2>
        {reviewSummary.reviews.length > 0 ? (
          <div className="space-y-4">
            {reviewSummary.reviews.map((review) => (
              <div key={review.id} className="border-b border-gray-50 pb-4 last:border-0">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-xs font-bold text-[#003366]">{review.customerName}</p>
                  <span className="flex items-center gap-1 text-xs font-black text-[#FF851B]">
                    <Star size={13} fill="#FF851B" stroke="none" />
                    {review.rating}
                  </span>
                </div>
                {review.description ? (
                  <p className="mt-2 text-xs text-gray-500 leading-6">{review.description}</p>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400">No ratings yet.</p>
        )}
      </div>
    </div>
  );
}
