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
} from "lucide-react";

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

export default function CustomerHome() {
  const [currentSlide, setCurrentSlide] = useState(0);

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

    </div>
  );
}
