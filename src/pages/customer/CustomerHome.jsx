import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Laptop,
  Shirt,
  Coffee,
  BookOpen,
  GraduationCap,
  PenTool,
  Camera,
  ShoppingBag,
  Home,
  Paperclip,
  Star,
} from "lucide-react";
import { useStorefrontListings } from "../../data/storefrontData";

const slides = [
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1491553895911-0055eca6402d?q=80&w=1200&auto=format&fit=crop",
];
const slideCount = slides.length;

const categories = [
  { name: "Electronics", icon: Laptop, path: "/products?category=electronics" },
  { name: "Apparel", icon: Shirt, path: "/products?category=apparel" },
  { name: "Food & Drink", icon: Coffee, path: "/products?category=food" },
  { name: "Books", icon: BookOpen, path: "/products?category=books" },
  { name: "Tutoring", icon: GraduationCap, path: "/services?category=tutoring" },
  { name: "Design", icon: PenTool, path: "/services?category=design" },
  { name: "Photography", icon: Camera, path: "/services?category=photo" },
  { name: "Errands", icon: ShoppingBag, path: "/services?category=errands" },
  { name: "Dorm Needs", icon: Home, path: "/products?category=dorm" },
  { name: "Stationery", icon: Paperclip, path: "/products?category=stationery" },
];

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?q=80&w=400&auto=format&fit=crop";

function ProductCard({ item }) {
  const image = item.img || item.images?.[0]?.url || FALLBACK_IMAGE;
  const hasDiscount = Boolean(item.discount);

  return (
    <Link to={`/product/${item.id}`} className="block h-full">
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
                PHP {Number(item.price || 0).toFixed(2)}
              </p>
              {hasDiscount ? (
                <p className="text-[9px] text-gray-300 line-through">
                  PHP {Number(item.oldPrice || 0).toFixed(2)}
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
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function ProductSection({ title, titleClassName = "text-[#003366]", to, products, empty }) {
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
      {products.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {products.slice(0, 10).map((item) => (
            <ProductCard key={item.id} item={item} />
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
  const { featuredProducts, onSaleProducts, loading, error } = useStorefrontListings();

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
              src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=600&auto=format&fit=crop"
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
              src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=400&auto=format&fit=crop"
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
      <ProductSection
        title="Featured Products"
        to="/products"
        products={featuredProducts}
        empty={
          loading
            ? "Loading featured products..."
            : error || "No products have enough paid weekly sales to be featured yet."
        }
      />

      {/* CATEGORIES */}
      <section className="bg-white border border-gray-100 shadow-sm rounded-sm">
        <div className="bg-gray-50/50 py-3 border-b border-gray-100 text-center">
          <h3 className="font-semibold text-gray-500 text-xs uppercase tracking-widest italic">
            CATEGORIES
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5">
          {categories.map((cat, i) => (
            <Link
              to={cat.path}
              key={i}
              className="border-r border-b border-gray-100 p-8 flex flex-col items-center gap-3 hover:bg-gray-50 transition-colors cursor-pointer group"
            >
              <div className="w-14 h-14 flex items-center justify-center transition-transform group-hover:scale-110">
                <cat.icon
                  size={32}
                  className="text-[#003366]"
                  strokeWidth={1.5}
                />
              </div>
              <span className="text-[11px] font-semibold text-gray-600">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ON SALE NOW */}
      <ProductSection
        title="On Sale Now"
        titleClassName="text-[#FF851B]"
        to="/products?sale=true"
        products={onSaleProducts}
        empty={
          loading
            ? "Loading on-sale products..."
            : error || "No discounted products have paid weekly sales yet."
        }
      />
    </div>
  );
}
