import React, { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ChevronRight,
  ChevronDown,
  List as ListIcon,
  Star,
  ShieldCheck,
  ChevronLeft,
} from "lucide-react";
import {
  matchesListing,
  storefrontDataDecision,
  useStorefrontListings,
} from "../../data/storefrontData";

const PAGE_SIZE = 20;
const FALLBACK_IMAGE = "/placeholders/offering.svg";
const FALLBACK_AVATAR = "/placeholders/avatar.svg";
const PRODUCT_CATEGORIES = [
  { label: "Apparel & Uniforms", value: "Fashion & Apparel" },
  { label: "School Supplies", value: "Books & Media" },
  { label: "Electronics", value: "Electronics & Technology" },
  { label: "Food & Drink", value: "Groceries & Essentials" },
];

export default function ShopProducts() {
  const [activeSort, setActiveSort] = useState("Popular");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchParams] = useSearchParams();
  const searchTerm = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";
  const saleOnly = searchParams.get("sale") === "true";

  const { products: storefrontProducts, loading, error } = useStorefrontListings();
  const merchants = useMemo(() => {
    const byId = new Map();
    storefrontProducts.forEach((item) => {
      if (!item.merchantId || byId.has(item.merchantId)) return;
      byId.set(item.merchantId, {
        id: item.merchantId,
        name: item.merchant || "Merchant",
        img: item.merchantAvatar || FALLBACK_AVATAR,
      });
    });
    return Array.from(byId.values()).slice(0, 12);
  }, [storefrontProducts]);
  const products = storefrontProducts
    .filter((item) => matchesListing(item, searchTerm, category))
    .filter((item) => !saleOnly || item.isOnSale)
    .sort((a, b) => {
      if (activeSort === "Top sales") {
        return (Number(b.weeklySold || 0) - Number(a.weeklySold || 0))
          || (Number(b.weeklyRevenue || 0) - Number(a.weeklyRevenue || 0));
      }
      if (activeSort === "Latest") {
        return Number(b.id || 0) - Number(a.id || 0);
      }
      if (activeSort === "Price: Low to High") {
        return Number(a.price || 0) - Number(b.price || 0);
      }
      if (activeSort === "Price: High to Low") {
        return Number(b.price || 0) - Number(a.price || 0);
      }
      return (Number(b.reviewCount || 0) - Number(a.reviewCount || 0))
        || (Number(b.weeklySold || 0) - Number(a.weeklySold || 0));
    });
  const totalPages = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
  const page = Math.min(currentPage, totalPages);
  const pagedProducts = products.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const togglePriceSort = () => {
    setCurrentPage(1);
    setActiveSort((current) =>
      current === "Price: Low to High" ? "Price: High to Low" : "Price: Low to High",
    );
  };

  return (
    <div className="bg-[#F5F7F9] min-h-screen pb-12 font-sans animate-in fade-in duration-500">
      <div className="max-w-[1400px] mx-auto px-4 pt-6">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-4 font-medium">
          <Link to="/" className="hover:text-[#FF851B] transition-colors">
            Home
          </Link>
          <ChevronRight size={12} />
          <span className="text-[#003366]">Shop products</span>
        </div>

        {/* VERIFIED MERCHANTS SECTION */}
        {merchants.length > 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm mb-6 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-50 flex justify-between items-center bg-[#F8FAFC]">
            <div className="flex items-center gap-2 text-[#003366]">
              <ShieldCheck size={18} className="text-[#FF851B]" />
              <h2 className="text-sm font-bold">Verified merchants</h2>
            </div>
            <Link
              to="/products"
              className="text-[11px] font-bold text-[#FF851B] flex items-center gap-1 hover:underline"
            >
              See all <ChevronRight size={12} />
            </Link>
          </div>

          <div className="p-5 flex gap-6 overflow-x-auto no-scrollbar">
            {merchants.map((merchant) => (
              <Link
                key={merchant.id}
                to={`/merchant/${merchant.id}`} /* <--- UPDATED LINK HERE */
                className="flex flex-col items-center gap-2 min-w-[100px] group"
              >
                <div className="w-20 h-20 rounded-full border-2 border-transparent group-hover:border-[#FF851B] p-0.5 transition-all duration-300">
                  <div className="w-full h-full rounded-full overflow-hidden bg-gray-100 shadow-sm">
                    <img
                      src={merchant.img}
                      alt={merchant.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(event) => {
                        event.currentTarget.src = FALLBACK_AVATAR;
                      }}
                    />
                  </div>
                </div>
                <span className="text-[10px] font-bold text-gray-600 text-center line-clamp-1 group-hover:text-[#003366] transition-colors">
                  {merchant.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
        ) : null}

        {/* MAIN LAYOUT: Sidebar + Content */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* LEFT SIDEBAR: Categories */}
          <div className="w-full md:w-64 shrink-0">
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden sticky top-24">
              <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2 text-[#003366] bg-[#F8FAFC]">
                <ListIcon size={18} className="text-[#FF851B]" />
                <h2 className="text-sm font-bold">Categories</h2>
              </div>
              <div className="p-2">
                {PRODUCT_CATEGORIES.map((cat) => (
                  <div key={cat.value} className="mb-1">
                    <Link
                      to={`/products?category=${encodeURIComponent(cat.value)}`}
                      onClick={() => setCurrentPage(1)}
                      className="w-full flex justify-between items-center px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 hover:text-[#003366] rounded-lg transition-colors group"
                    >
                      <span className="flex items-center gap-2">
                        <ChevronRight
                          size={14}
                          className="text-gray-300 group-hover:text-[#FF851B] transition-colors"
                        />
                        {cat.label}
                      </span>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT CONTENT: Sort Bar & Grid */}
          <div className="flex-grow min-w-0">
            {/* Sort Bar */}
            <div className="bg-[#F8FAFC] border border-gray-100 rounded-xl p-3 mb-6 flex flex-wrap justify-between items-center gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-gray-500 font-bold ml-2">
                  Sort by:
                </span>
                <div className="flex gap-2">
                  {["Popular", "Latest", "Top sales"].map((sort) => (
                    <button
                      key={sort}
                      onClick={() => {
                        setCurrentPage(1);
                        setActiveSort(sort);
                      }}
                      className={`px-5 py-2 text-xs font-bold rounded-md transition-all ${
                        activeSort === sort
                          ? "bg-[#FF851B] text-white shadow-md shadow-orange-100"
                          : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {sort}
                    </button>
                  ))}
                  <button
                    onClick={togglePriceSort}
                    className={`px-4 py-2 border text-xs font-bold rounded-md flex items-center gap-2 hover:bg-gray-50 transition-all ${
                      activeSort.startsWith("Price:")
                        ? "bg-[#FF851B] text-white border-[#FF851B]"
                        : "bg-white text-gray-600 border-gray-200"
                    }`}
                  >
                    {activeSort.startsWith("Price:") ? activeSort : "Price"}{" "}
                    <ChevronDown size={14} />
                  </button>
                </div>
              </div>

              {/* Pagination (Top) */}
              <div className="flex items-center gap-3 mr-2">
                <span className="text-[11px] font-bold">
                  <span className="text-[#FF851B]">{page}</span> / {totalPages}
                </span>
                <div className="flex gap-1">
                  <button
                    disabled={page <= 1}
                    onClick={() => setCurrentPage((current) => Math.max(1, current - 1))}
                    className="w-7 h-7 flex items-center justify-center bg-white border border-gray-200 rounded text-gray-400 hover:bg-gray-50 transition-colors disabled:opacity-40"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setCurrentPage((current) => Math.min(totalPages, current + 1))}
                    className="w-7 h-7 flex items-center justify-center bg-white border border-gray-200 rounded text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>

            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-bold text-gray-500">
                {products.length} product{products.length === 1 ? "" : "s"}
                {searchTerm ? ` matching "${searchTerm}"` : ""}
                {category ? ` in ${category}` : ""}
                {saleOnly ? " on sale" : ""}
              </p>
              <p className="max-w-2xl text-[10px] font-semibold text-gray-400">
                {storefrontDataDecision}
              </p>
            </div>

            {/* Product Grid (5 Columns) */}
            {loading ? (
              <div className="bg-white border border-gray-100 rounded-xl p-12 text-center">
                <p className="text-sm font-bold text-[#003366]">
                  Loading products...
                </p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-100 rounded-xl p-12 text-center">
                <p className="text-sm font-bold text-red-600">{error}</p>
              </div>
            ) : products.length === 0 ? (
              <div className="bg-white border border-gray-100 rounded-xl p-12 text-center">
                <p className="text-sm font-bold text-[#003366]">
                  No products found.
                </p>
                <p className="mt-2 text-xs text-gray-400">
                  Try another search term or browse all products.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {pagedProducts.map((item) => (
                <Link
                  to={`/product/${item.id}`}
                  key={item.id}
                  className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-xl hover:border-[#FF851B]/30 transition-all duration-300 group flex flex-col"
                >
                  {/* Image */}
                  <div className="aspect-square bg-gray-50 relative overflow-hidden">
                    <img
                      src={item.img || item.images?.[0]?.url || FALLBACK_IMAGE}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(event) => {
                        event.currentTarget.src = FALLBACK_IMAGE;
                      }}
                    />
                  </div>

                  {/* Card Details */}
                  <div className="p-4 flex flex-col flex-grow">
                    <h3 className="text-[11px] font-medium text-gray-700 leading-tight mb-2 line-clamp-2 group-hover:text-[#003366] transition-colors">
                      {item.name}
                    </h3>

                    <div className="mt-auto">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-sm font-bold text-[#FF851B]">
                          ₱{item.price.toFixed(2)}
                        </span>
                        <span className="text-[9px] text-gray-400 line-through">
                          ₱{item.oldPrice.toFixed(2)}
                        </span>
                        <span className="text-[9px] text-red-500 font-bold">
                          {item.discount}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5">
                          <Star
                            size={10}
                            fill="#FF851B"
                            className="text-[#FF851B]"
                          />
                        </div>
                        <span className="text-[9px] text-gray-400 font-medium">
                          {item.rating !== null ? `${item.rating} (${item.reviewCount || 0})` : "No ratings"}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
                ))}
              </div>
            )}

            {/* Return Home Button */}
            <div className="mt-12 flex justify-center">
              <Link
                to="/"
                className="px-12 py-3 bg-transparent border-2 border-[#FF851B] text-[#FF851B] text-xs font-bold rounded-lg hover:bg-[#FF851B] hover:text-white transition-all duration-300"
              >
                Return home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
