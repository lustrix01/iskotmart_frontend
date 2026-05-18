import { Link, useSearchParams } from "react-router-dom";
import { Search, ShoppingBag, Star, Wrench } from "lucide-react";
import {
  matchesListing,
  useStorefrontListings,
} from "../../data/storefrontData";

const FALLBACK_IMAGE = "/placeholders/offering.svg";

function ProductResultCard({ item }) {
  const image = item.img || item.images?.[0]?.url || FALLBACK_IMAGE;

  return (
    <Link
      to={`/product/${item.id}`}
      className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-xl hover:border-[#FF851B]/30 transition-all duration-300 group flex flex-col"
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
        <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm p-1.5 rounded-md shadow-sm">
          <ShoppingBag size={14} className="text-[#FF851B]" />
        </div>
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">
          {item.merchant}
        </p>
        <h3 className="text-[11px] font-medium text-gray-700 leading-tight mb-2 line-clamp-2 group-hover:text-[#003366] transition-colors">
          {item.name}
        </h3>
        <div className="mt-auto">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-sm font-bold text-[#FF851B]">
              PHP {item.price.toFixed(2)}
            </span>
            <span className="text-[9px] text-gray-400 line-through">
              PHP {item.oldPrice.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Star size={10} fill="#FF851B" className="text-[#FF851B]" />
            <span className="text-[9px] text-gray-400 font-medium">
              {item.rating} | {item.sold} sold
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function ServiceResultCard({ item }) {
  const image = item.img || item.images?.[0]?.url || FALLBACK_IMAGE;

  return (
    <Link
      to={`/service/${item.id}`}
      className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-xl hover:border-[#0074D9]/30 transition-all duration-300 group flex flex-col"
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
        <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm p-1.5 rounded-md shadow-sm">
          <Wrench size={14} className="text-[#0074D9]" />
        </div>
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">
          {item.merchant}
        </p>
        <h3 className="text-[11px] font-medium text-gray-700 leading-tight mb-2 line-clamp-2 group-hover:text-[#003366] transition-colors">
          {item.name}
        </h3>
        <div className="mt-auto">
          <div className="flex items-end gap-1 mb-1.5">
            <span className="text-sm font-bold text-[#0074D9]">
              PHP {item.price.toFixed(2)}
            </span>
            <span className="text-[9px] text-gray-400 mb-0.5">
              {item.rateType}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1">
              <Star size={12} fill="#FF851B" className="text-[#FF851B]" />
              <span className="text-[10px] font-bold text-gray-700">
                {item.rating}
              </span>
            </div>
            <span className="text-[9px] text-gray-400 font-medium">
              {item.completed} done
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const searchTerm = searchParams.get("q") || "";
  const { products: storefrontProducts, services: storefrontServices, loading, error } =
    useStorefrontListings();
  const products = storefrontProducts.filter((item) =>
    matchesListing(item, searchTerm, ""),
  );
  const services = storefrontServices.filter((item) =>
    matchesListing(item, searchTerm, ""),
  );
  const totalResults = products.length + services.length;

  return (
    <div className="bg-[#F5F7F9] min-h-screen pb-12 font-sans animate-in fade-in duration-500">
      <div className="max-w-[1400px] mx-auto px-4 pt-6">
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#003366]">
              <Search size={18} className="text-[#FF851B]" />
              <h1 className="text-sm font-bold">Search results</h1>
            </div>
            <p className="mt-2 text-xs text-gray-500 font-semibold">
              {searchTerm
                ? `${totalResults} result${totalResults === 1 ? "" : "s"} for "${searchTerm}"`
                : `${totalResults} storefront listings`}
            </p>
          </div>
          <div className="flex gap-2 text-[10px] font-bold">
            <Link
              to={`/products${searchTerm ? `?q=${encodeURIComponent(searchTerm)}` : ""}`}
              className="rounded-md border border-gray-200 bg-white px-4 py-2 text-[#FF851B] hover:border-[#FF851B]"
            >
              Products only
            </Link>
            <Link
              to={`/services${searchTerm ? `?q=${encodeURIComponent(searchTerm)}` : ""}`}
              className="rounded-md border border-gray-200 bg-white px-4 py-2 text-[#0074D9] hover:border-[#0074D9]"
            >
              Services only
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="bg-white border border-gray-100 rounded-xl p-12 text-center">
            <p className="text-sm font-bold text-[#003366]">Loading listings...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 rounded-xl p-12 text-center">
            <p className="text-sm font-bold text-red-600">{error}</p>
          </div>
        ) : totalResults === 0 ? (
          <div className="bg-white border border-gray-100 rounded-xl p-12 text-center">
            <p className="text-sm font-bold text-[#003366]">
              No storefront matches found.
            </p>
            <p className="mt-2 text-xs text-gray-400">
              Try another product, service, category, or merchant name.
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-bold text-[#003366]">
                  Products ({products.length})
                </h2>
                <Link
                  to={`/products${searchTerm ? `?q=${encodeURIComponent(searchTerm)}` : ""}`}
                  className="text-[10px] font-bold text-[#FF851B] hover:underline"
                >
                  See product page
                </Link>
              </div>
              {products.length === 0 ? (
                <div className="bg-white border border-gray-100 rounded-xl p-8 text-center text-xs font-semibold text-gray-400">
                  No matching products.
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {products.map((item) => (
                    <ProductResultCard key={item.id} item={item} />
                  ))}
                </div>
              )}
            </section>

            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-bold text-[#003366]">
                  Services ({services.length})
                </h2>
                <Link
                  to={`/services${searchTerm ? `?q=${encodeURIComponent(searchTerm)}` : ""}`}
                  className="text-[10px] font-bold text-[#0074D9] hover:underline"
                >
                  See service page
                </Link>
              </div>
              {services.length === 0 ? (
                <div className="bg-white border border-gray-100 rounded-xl p-8 text-center text-xs font-semibold text-gray-400">
                  No matching services.
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {services.map((item) => (
                    <ServiceResultCard key={item.id} item={item} />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
