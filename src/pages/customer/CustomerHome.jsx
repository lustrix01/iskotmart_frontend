import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Wrench,
  Star,
} from "lucide-react";
import { useStorefrontListings } from "../../data/storefrontData";

const slides = [
  "/homepage/slide-products.jpg",
  "/homepage/slide-audio.jpg",
  "/homepage/slide-shoes.jpg",
];
const slideCount = slides.length;

const FALLBACK_IMAGE = "/placeholders/offering.svg";

function OfferingCard({ item }) {
  const image = item.img || item.images?.[0]?.url || FALLBACK_IMAGE;
  const hasDiscount = Boolean(item.discount);
  const isService = item.type === "service";

  return (
    <Link to={`/${isService ? "service" : "product"}/${item.id}`} className="block h-full">
      <div className="bg-white p-2 rounded-sm border border-transparent hover:border-gray-100 hover:shadow-md transition-all cursor-pointer group h-full flex flex-col">
        <div className="bg-gray-50 aspect-square mb-2 overflow-hidden rounded-sm shrink-0 relative">
          <img
            src={image}
            alt={item.name}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
            onError={(event) => {
              event.currentTarget.src = FALLBACK_IMAGE;
            }}
          />
          {hasDiscount ? (
            <span className="absolute left-2 top-2 bg-red-500 text-white text-[9px] font-black px-2 py-1 rounded-sm">
              {item.discount}
            </span>
          ) : null}
          <span className="absolute right-2 top-2 bg-white/90 text-[#003366] rounded-sm p-1 shadow-sm">
            {isService ? <Wrench size={12} /> : <ShoppingBag size={12} />}
          </span>
        </div>
        <div className="flex flex-col flex-grow justify-between">
          <div>
            <p className="text-[10px] text-gray-400 mb-0.5 font-normal truncate">
              {item.merchant || "Merchant"}
            </p>
            <h4 className="text-[11px] font-medium text-gray-800 leading-tight line-clamp-2 uppercase">
              {item.name}
            </h4>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <p className="text-[#FF851B] font-semibold text-xs">
                ₱{Number(item.price || 0).toFixed(2)}
              </p>
              {hasDiscount ? (
                <p className="text-[9px] text-gray-300 line-through">
                  ₱{Number(item.oldPrice || 0).toFixed(2)}
                </p>
              ) : null}
            </div>
            <div className="flex items-center gap-1 text-[9px] mt-1">
              <Star size={10} fill="#FF851B" stroke="none" />
              <span className="text-gray-400">
                {item.rating !== null ? `${item.rating} (${item.reviewCount || 0})` : "No ratings"}
              </span>
              {Number(item.weeklySold || 0) > 0 ? (
                <span className="ml-auto text-gray-300">{item.weeklySold} sold/week</span>
              ) : isService && Number(item.completed || 0) > 0 ? (
                <span className="ml-auto text-gray-300">{item.completed} booked</span>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function OfferingSection({ title, titleClassName = "text-[#003366]", to, offerings, empty }) {
  return (
    <section className="bg-white p-4 border border-gray-100 shadow-sm rounded-sm">
      <div className="flex justify-between items-center mb-4 border-b pb-2">
        <h3 className={`font-semibold text-sm italic ${titleClassName}`}>{title}</h3>
        <Link
          to={to}
          className="text-[10px] text-[#FF851B] font-semibold hover:underline"
        >
          See All &gt;
        </Link>
      </div>
      {offerings.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {offerings.slice(0, 10).map((item) => (
            <OfferingCard key={`${item.type}-${item.id}`} item={item} />
          ))}
        </div>
      ) : (
        <div className="border border-dashed border-gray-200 rounded-sm p-8 text-center">
          <p className="text-xs font-bold text-gray-400">{empty}</p>
        </div>
      )}
    </section>
  );
}

export default function CustomerHome() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { featuredProducts, featuredServices, onSaleProducts, loading, error } = useStorefrontListings();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === slideCount - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, []);


  return (
    <div className="max-w-[1400px] mx-auto p-4 lg:p-6 space-y-6 bg-white">
      {/* HERO SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:h-[320px] mb-6 overflow-hidden">
        {/* Main Carousel (75% width) */}
        <div className="lg:col-span-3 relative h-[250px] lg:h-full rounded-sm overflow-hidden shadow-sm border border-gray-100">
          <div
            className="flex h-full transition-transform duration-700 ease-in-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {slides.map((s, i) => (
              <img
                key={i}
                src={s}
                className="w-full h-full object-cover shrink-0"
                alt={`Slide ${i}`}
              />
            ))}
          </div>
          <button
            onClick={() =>
              setCurrentSlide(
                currentSlide === 0 ? slides.length - 1 : currentSlide - 1,
              )
            }
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/40 hover:bg-white p-1.5 rounded-full transition-colors z-10"
          >
            <ChevronLeft size={18} className="text-[#003366]" />
          </button>
          <button
            onClick={() =>
              setCurrentSlide(
                currentSlide === slides.length - 1 ? 0 : currentSlide + 1,
              )
            }
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/40 hover:bg-white p-1.5 rounded-full transition-colors z-10"
          >
            <ChevronRight size={18} className="text-[#003366]" />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {slides.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all ${currentSlide === i ? "w-5 bg-[#FF851B]" : "w-1.5 bg-white"}`}
              />
            ))}
          </div>
        </div>

        {/* Side Banners (25% width) */}
        <div className="hidden lg:flex flex-col gap-3 h-full overflow-hidden">
          {/* Shop Products Link */}
          <Link
            to="/products"
            className="flex-1 relative overflow-hidden group cursor-pointer shadow-sm rounded-sm border border-gray-100 block"
          >
            <img
              src="/homepage/shop-products.jpg"
              className="w-full h-full object-cover brightness-75 transition-transform group-hover:scale-105"
              alt="Shop Products"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/10">
              <h3 className="text-white font-bold text-lg uppercase tracking-wider italic">
                Shop Products
              </h3>
            </div>
          </Link>

          {/* Book Services Link */}
          <Link
            to="/services"
            className="flex-1 relative overflow-hidden group cursor-pointer shadow-sm rounded-sm border border-gray-100 block"
          >
            <img
              src="/homepage/book-services.jpg"
              className="w-full h-full object-cover brightness-75 transition-transform group-hover:scale-105"
              alt="Book Services"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/10">
              <h3 className="text-white font-bold text-lg uppercase tracking-wider italic">
                Book Services
              </h3>
            </div>
          </Link>
        </div>
      </div>

      {/* FEATURED PRODUCTS */}
      <OfferingSection
        title="Featured Products"
        to="/products"
        offerings={featuredProducts}
        empty={
          loading
            ? "Loading featured products..."
            : error || "No products have enough paid weekly sales to be featured yet."
        }
      />

      {/* FEATURED SERVICES */}
      <OfferingSection
        title="Featured Services"
        to="/services"
        offerings={featuredServices}
        empty={
          loading
            ? "Loading featured services..."
            : error || "No services have enough completed bookings to be featured yet."
        }
      />

      {/* ON SALE NOW */}
      <OfferingSection
        title="On Sale Now"
        titleClassName="text-[#FF851B]"
        to="/products?sale=true"
        offerings={onSaleProducts}
        empty={
          loading
            ? "Loading on-sale products..."
            : error || "No discounted products have paid weekly sales yet."
        }
      />
    </div>
  );
}
