import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Minus, Plus, ShoppingCart, Star } from "lucide-react";
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
              <Star size={14} fill="#FF851B" stroke="none" /> {Number(item.rating || 0).toFixed(1)}
            </span>
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
          </div>
        </div>
      </div>
    </div>
  );
}
