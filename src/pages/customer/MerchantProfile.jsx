import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ChevronRight,
  Heart,
  MessageSquare,
  ShieldCheck,
  Star,
  Store,
  Wrench,
} from "lucide-react";
import { useAuth } from "../../context/useAuth";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?q=80&w=400&auto=format&fit=crop";

const FALLBACK_AVATAR =
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=250&auto=format&fit=crop";

export default function MerchantProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("products");
  const [merchant, setMerchant] = useState(null);
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [messageLoading, setMessageLoading] = useState(false);

  const showNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2500);
  };

  useEffect(() => {
    let isMounted = true;

    const loadMerchant = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await fetch(
          `/api/public_merchant.php?id=${encodeURIComponent(id)}`,
          { credentials: "include" },
        );
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload.error || "Unable to load merchant profile.");
        }

        if (isMounted) {
          setMerchant(payload.profile || null);
          setProducts(Array.isArray(payload.products) ? payload.products : []);
          setServices(Array.isArray(payload.services) ? payload.services : []);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message);
          setMerchant(null);
          setProducts([]);
          setServices([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadMerchant();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const goToLogin = () => {
    navigate("/login", { state: { from: location } });
  };

  const handleMessageMerchant = async () => {
    if (!user) {
      goToLogin();
      return;
    }
    if (!merchant?.id || messageLoading) {
      return;
    }

    setMessageLoading(true);
    try {
      const response = await fetch("/api/customer_messages.php", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchantId: Number(merchant.id),
          message: `Hi, I would like to ask about your shop ${merchant.name}.`,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Unable to message merchant.");
      }
      navigate("/profile/messages");
    } catch (messageError) {
      showNotice(messageError.message);
    } finally {
      setMessageLoading(false);
    }
  };

  const activeItems = activeTab === "products" ? products : services;

  if (loading) {
    return (
      <div className="bg-[#F5F7F9] min-h-screen pb-12 font-sans">
        <div className="max-w-[1200px] mx-auto px-4 pt-6">
          <div className="bg-white border border-gray-100 rounded-xl p-10 text-center">
            <p className="text-sm font-bold text-[#003366]">Loading merchant profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !merchant) {
    return (
      <div className="bg-[#F5F7F9] min-h-screen pb-12 font-sans">
        <div className="max-w-[1200px] mx-auto px-4 pt-6 space-y-4">
          <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
            <Link to="/" className="hover:text-[#0074D9] transition-colors">
              Home
            </Link>
            <ChevronRight size={12} />
            <span className="text-[#003366]">Merchant</span>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-xl p-10 text-center">
            <AlertCircle size={28} className="mx-auto mb-3 text-red-500" />
            <p className="text-sm font-bold text-red-600">
              {error || "Merchant profile was not found."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F5F7F9] min-h-screen pb-12 font-sans animate-in fade-in duration-500">
      {notice ? (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#003366] text-white px-5 py-2 rounded-md text-xs font-bold">
          {notice}
        </div>
      ) : null}

      <div className="max-w-[1200px] mx-auto px-4 pt-6">
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-4 font-medium">
          <Link to="/" className="hover:text-[#0074D9] transition-colors">
            Home
          </Link>
          <ChevronRight size={12} />
          <Link to="/products" className="hover:text-[#0074D9] transition-colors">
            Shop products
          </Link>
          <ChevronRight size={12} />
          <span className="text-[#003366]">{merchant.name}</span>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm mb-8 overflow-hidden">
          <div className="h-48 bg-[#003366] w-full relative overflow-hidden">
            {merchant.bannerUrl ? (
              <img
                src={merchant.bannerUrl}
                alt={`${merchant.name} banner`}
                className="w-full h-full object-cover"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            ) : null}
            <div className={`absolute inset-0 ${merchant.bannerUrl ? "bg-black/20" : "opacity-15 bg-[radial-gradient(circle_at_20%_20%,#ffffff_0,transparent_32%),radial-gradient(circle_at_80%_30%,#FF851B_0,transparent_28%)]"}`}></div>
          </div>

          <div className="px-8 pb-8 relative">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 -mt-16 mb-6">
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-4 border-white shadow-md overflow-hidden bg-gray-100">
                  <img
                    src={merchant.avatar || FALLBACK_AVATAR}
                    alt={merchant.name}
                    className="w-full h-full object-cover"
                    onError={(event) => {
                      event.currentTarget.src = FALLBACK_AVATAR;
                    }}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleMessageMerchant}
                  disabled={messageLoading}
                  className="px-6 py-2.5 bg-white border border-[#0074D9] text-[#0074D9] text-xs font-bold rounded-lg hover:bg-blue-50 transition-all flex items-center gap-2"
                >
                  <MessageSquare size={16} />
                  {messageLoading ? "Opening..." : "Message"}
                </button>
                <button
                  onClick={() => showNotice("Shop followed.")}
                  className="px-8 py-2.5 bg-[#FF851B] text-white text-xs font-bold rounded-lg hover:bg-[#E67616] shadow-sm shadow-orange-100 transition-all flex items-center gap-2"
                >
                  <Heart size={16} />
                  Follow
                </button>
              </div>
            </div>

            <div className="max-w-2xl mb-8">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  {merchant.name}
                </h1>
                {merchant.isVerified ? (
                  <ShieldCheck size={20} className="text-[#0074D9]" />
                ) : null}
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                {merchant.bio}
              </p>
              {merchant.address ? (
                <p className="mt-3 text-xs font-bold text-gray-400">
                  {merchant.address}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-10 border-t border-gray-100 pt-6">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Rating
                </p>
                <div className="flex items-center gap-1.5">
                  <Star size={14} fill="#FF851B" className="text-[#FF851B]" />
                  <span className="text-sm font-bold text-gray-900">
                    {Number(merchant.rating || 0).toFixed(1)}{" "}
                    <span className="text-xs text-gray-400 font-medium">
                      ({merchant.reviews || 0})
                    </span>
                  </span>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Active products
                </p>
                <p className="text-sm font-bold text-gray-900">
                  {merchant.offeringCounts?.products || products.length}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Active services
                </p>
                <p className="text-sm font-bold text-gray-900">
                  {merchant.offeringCounts?.services || services.length}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Joined
                </p>
                <p className="text-sm font-bold text-gray-900">
                  {merchant.joined || "Recently"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-8 border-b border-gray-200 mb-6 px-2">
          <button
            onClick={() => setActiveTab("products")}
            className={`pb-3 text-sm font-bold transition-colors relative ${
              activeTab === "products" ? "text-[#FF851B]" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Products <span className="text-xs opacity-60 font-medium">({products.length})</span>
            {activeTab === "products" ? (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#FF851B] rounded-t-full"></div>
            ) : null}
          </button>
          <button
            onClick={() => setActiveTab("services")}
            className={`pb-3 text-sm font-bold transition-colors relative ${
              activeTab === "services" ? "text-[#FF851B]" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Services <span className="text-xs opacity-60 font-medium">({services.length})</span>
            {activeTab === "services" ? (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#FF851B] rounded-t-full"></div>
            ) : null}
          </button>
        </div>

        {activeItems.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-xl p-12 text-center">
            <Store size={28} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm font-bold text-[#003366]">
              No active {activeTab} from this merchant yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {activeItems.map((item) => {
              const isService = item.type === "service";
              const itemPath = isService ? `/service/${item.id}` : `/product/${item.id}`;
              const image = item.img || item.images?.[0]?.url || FALLBACK_IMAGE;

              return (
                <Link
                  to={itemPath}
                  key={`${item.type}-${item.id}`}
                  className={`bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 group flex flex-col ${
                    isService ? "hover:border-[#0074D9]/30" : "hover:border-[#FF851B]/30"
                  }`}
                >
                  <div className="aspect-square bg-gray-50 relative overflow-hidden">
                    <img
                      src={image}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(event) => {
                        event.currentTarget.src = FALLBACK_IMAGE;
                      }}
                    />
                    {isService ? (
                      <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm p-1.5 rounded-md shadow-sm">
                        <Wrench size={14} className="text-[#0074D9]" />
                      </div>
                    ) : null}
                  </div>
                  <div className="p-4 flex flex-col flex-grow">
                    <h3 className="text-[11px] font-medium text-gray-700 leading-tight mb-2 line-clamp-2 group-hover:text-[#003366] transition-colors">
                      {item.name}
                    </h3>
                    <div className="mt-auto">
                      <div className="flex items-end gap-1 mb-1">
                        <span className={`text-sm font-bold ${isService ? "text-[#0074D9]" : "text-[#FF851B]"}`}>
                          PHP {Number(item.price || 0).toFixed(2)}
                        </span>
                        {isService ? (
                          <span className="text-[9px] text-gray-400 mb-0.5">
                            {item.rateType}
                          </span>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-1 text-[#FF851B] text-[10px]">
                        <Star size={11} fill="#FF851B" className="text-[#FF851B]" />
                        <span className="text-gray-400 font-medium ml-0.5">
                          {Number(item.rating || 0).toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
