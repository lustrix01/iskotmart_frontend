import React, { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ChevronRight,
  ChevronDown,
  List as ListIcon,
  Star,
  ShieldCheck,
  ChevronLeft,
  Wrench,
} from "lucide-react";
import {
  matchesListing,
  storefrontDataDecision,
  useStorefrontListings,
} from "../../data/storefrontData";

const PAGE_SIZE = 20;
const FALLBACK_IMAGE = "/placeholders/offering.svg";
const FALLBACK_AVATAR = "/placeholders/avatar.svg";
const SERVICE_CATEGORIES = [
  { label: "Academics & Tutoring", value: "Academics & Tutoring" },
  { label: "Graphic Design", value: "Creative Services" },
  { label: "Tech Support", value: "Tech Support" },
  { label: "Errands & Tasks", value: "Errands & Tasks" },
];

export default function BookServices() {
  const [activeSort, setActiveSort] = useState("Highest Rated");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchParams] = useSearchParams();
  const searchTerm = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";
  const showAllMerchants = searchParams.get("merchants") === "all";

  const { services: storefrontServices, loading, error } = useStorefrontListings();
  const merchants = useMemo(() => {
    const byId = new Map();
    storefrontServices.forEach((item) => {
      if (!item.merchantId || byId.has(item.merchantId)) return;
      byId.set(item.merchantId, {
        id: item.merchantId,
        name: item.merchant || "Merchant",
        img: item.merchantAvatar || FALLBACK_AVATAR,
      });
    });
    const allMerchants = Array.from(byId.values());
    return showAllMerchants ? allMerchants : allMerchants.slice(0, 12);
  }, [showAllMerchants, storefrontServices]);
  const services = storefrontServices
    .filter((item) => matchesListing(item, searchTerm, category))
    .sort((a, b) => {
      if (activeSort === "Most Booked") {
        return Number(b.completed || 0) - Number(a.completed || 0);
      }
      if (activeSort === "Newest") {
        return Number(b.id || 0) - Number(a.id || 0);
      }
      if (activeSort === "Rate: Low to High") {
        return Number(a.price || 0) - Number(b.price || 0);
      }
      if (activeSort === "Rate: High to Low") {
        return Number(b.price || 0) - Number(a.price || 0);
      }
      return (Number(b.rating || 0) - Number(a.rating || 0))
        || (Number(b.reviewCount || 0) - Number(a.reviewCount || 0));
    });
  const totalPages = Math.max(1, Math.ceil(services.length / PAGE_SIZE));
  const page = Math.min(currentPage, totalPages);
  const pagedServices = services.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleRateSort = () => {
    setCurrentPage(1);
    setActiveSort((current) =>
      current === "Rate: Low to High" ? "Rate: High to Low" : "Rate: Low to High",
    );
  };

  return (
    <div className="bg-[#F5F7F9] min-h-screen pb-12 font-sans animate-in fade-in duration-500">
      <div className="max-w-[1400px] mx-auto px-4 pt-6">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-4 font-medium">
          <Link to="/" className="hover:text-[#0074D9] transition-colors">
            Home
          </Link>
          <ChevronRight size={12} />
          <span className="text-[#003366]">Book services</span>
        </div>

        {/* VERIFIED FREELANCERS SECTION */}
        {merchants.length > 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm mb-6 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-50 flex justify-between items-center bg-[#F8FAFC]">
            <div className="flex items-center gap-2 text-[#003366]">
              <ShieldCheck size={18} className="text-[#0074D9]" />
              <h2 className="text-sm font-bold">
                Verified student merchants
              </h2>
            </div>
            <Link
              to={showAllMerchants ? "/services" : "/services?merchants=all"}
              className="text-[11px] font-bold text-[#0074D9] flex items-center gap-1 hover:underline"
            >
              {showAllMerchants ? "Show less" : "See all"} <ChevronRight size={12} />
            </Link>
          </div>

          <div className="p-5 flex gap-6 overflow-x-auto no-scrollbar">
            {merchants.map((person) => (
              <Link
                key={person.id}
                to={`/merchant/${person.id}`}
                className="flex flex-col items-center gap-2 min-w-[100px] group"
              >
                <div className="w-20 h-20 rounded-full border-2 border-transparent group-hover:border-[#0074D9] p-0.5 transition-all duration-300">
                  <div className="w-full h-full rounded-full overflow-hidden bg-gray-100 shadow-sm">
                    <img
                      src={person.img}
                      alt={person.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(event) => {
                        event.currentTarget.src = FALLBACK_AVATAR;
                      }}
                    />
                  </div>
                </div>
                <span className="text-[10px] font-bold text-gray-600 text-center line-clamp-1 group-hover:text-[#003366] transition-colors">
                  {person.name}
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
                <ListIcon size={18} className="text-[#0074D9]" />
                <h2 className="text-sm font-bold">Service categories</h2>
              </div>
              <div className="p-2">
                {SERVICE_CATEGORIES.map((cat) => (
                  <div key={cat.value} className="mb-1">
                    <Link
                      to={`/services?category=${encodeURIComponent(cat.value)}`}
                      onClick={() => setCurrentPage(1)}
                      className={`w-full flex justify-between items-center px-4 py-2.5 text-xs font-bold rounded-lg transition-colors group ${
                        category === cat.value
                          ? "bg-blue-50 text-[#003366] border border-blue-100"
                          : "text-gray-700 hover:bg-gray-50 hover:text-[#003366]"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <ChevronRight
                          size={14}
                          className={`transition-colors ${
                            category === cat.value ? "text-[#0074D9]" : "text-gray-300 group-hover:text-[#0074D9]"
                          }`}
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
                  {["Highest Rated", "Most Booked", "Newest"].map((sort) => (
                    <button
                      key={sort}
                      onClick={() => {
                        setCurrentPage(1);
                        setActiveSort(sort);
                      }}
                      className={`px-5 py-2 text-xs font-bold rounded-md transition-all ${
                        activeSort === sort
                          ? "bg-[#0074D9] text-white shadow-md shadow-blue-100"
                          : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {sort}
                    </button>
                  ))}
                  <button
                    onClick={toggleRateSort}
                    className={`px-4 py-2 border text-xs font-bold rounded-md flex items-center gap-2 transition-all ${
                      activeSort.startsWith("Rate:")
                        ? "bg-[#0074D9] text-white border-[#0074D9] hover:bg-[#0068C3]"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {activeSort.startsWith("Rate:") ? activeSort : "Rate"}{" "}
                    <ChevronDown size={14} />
                  </button>
                </div>
              </div>

              {/* Pagination */}
              <div className="flex items-center gap-3 mr-2">
                <span className="text-[11px] font-bold">
                  <span className="text-[#0074D9]">{page}</span> / {totalPages}
                </span>
                <div className="flex gap-1">
                  <button
                    disabled={page <= 1}
                    onClick={() => setCurrentPage((current) => Math.max(1, current - 1))}
                    className="w-7 h-7 flex items-center justify-center bg-white border border-gray-200 rounded text-gray-400 hover:bg-gray-50 disabled:opacity-40"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setCurrentPage((current) => Math.min(totalPages, current + 1))}
                    className="w-7 h-7 flex items-center justify-center bg-white border border-gray-200 rounded text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>

            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-bold text-gray-500">
                {services.length} service{services.length === 1 ? "" : "s"}
                {searchTerm ? ` matching "${searchTerm}"` : ""}
                {category ? ` in ${category}` : ""}
              </p>
              <p className="max-w-2xl text-[10px] font-semibold text-gray-400">
                {storefrontDataDecision}
              </p>
            </div>

            {/* Service Grid (5 Columns) */}
            {loading ? (
              <div className="bg-white border border-gray-100 rounded-xl p-12 text-center">
                <p className="text-sm font-bold text-[#003366]">
                  Loading services...
                </p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-100 rounded-xl p-12 text-center">
                <p className="text-sm font-bold text-red-600">{error}</p>
              </div>
            ) : services.length === 0 ? (
              <div className="bg-white border border-gray-100 rounded-xl p-12 text-center">
                <p className="text-sm font-bold text-[#003366]">
                  No services found.
                </p>
                <p className="mt-2 text-xs text-gray-400">
                  Try another search term or browse all services.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {pagedServices.map((item) => (
                <Link
                  to={`/service/${item.id}`}
                  key={item.id}
                  className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-xl hover:border-[#0074D9]/30 transition-all duration-300 group flex flex-col"
                >
                  {/* Image with Tool Icon Badge */}
                  <div className="aspect-square bg-gray-50 relative overflow-hidden">
                    <img
                      src={item.img || item.images?.[0]?.url || FALLBACK_IMAGE}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(event) => {
                        event.currentTarget.src = FALLBACK_IMAGE;
                      }}
                    />
                    <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm p-1.5 rounded-md shadow-sm">
                      <Wrench size={14} className="text-[#0074D9]" />
                    </div>
                  </div>

                  {/* Card Details */}
                  <div className="p-4 flex flex-col flex-grow">
                    <h3 className="text-[11px] font-medium text-gray-700 leading-tight mb-2 line-clamp-2 group-hover:text-[#003366] transition-colors">
                      {item.name}
                    </h3>

                    <div className="mt-auto">
                      <div className="flex items-end gap-1 mb-1.5">
                        <span className="text-sm font-bold text-[#0074D9]">
                          ₱{item.price.toFixed(2)}
                        </span>
                        <span className="text-[9px] text-gray-400 mb-0.5">
                          {item.rateType}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1">
                          <Star
                            size={12}
                            fill="#FF851B"
                            className="text-[#FF851B]"
                          />
                          <span className="text-[10px] font-bold text-gray-700">
                            {item.rating !== null ? item.rating : "No ratings"}
                          </span>
                        </div>
                        <span className="text-[9px] text-gray-400 font-medium">
                          {item.completed} done
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
                className="px-12 py-3 bg-transparent border-2 border-[#0074D9] text-[#0074D9] text-xs font-bold rounded-lg hover:bg-[#0074D9] hover:text-white transition-all duration-300"
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
