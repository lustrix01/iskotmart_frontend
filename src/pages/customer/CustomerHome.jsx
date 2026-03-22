import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function CustomerHome() {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Unique high-quality sample images for the carousel
  const slides = [
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1491553895911-0055eca6402d?q=80&w=1200&auto=format&fit=crop",
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  // Reusable Product Card Component with Link integration
  const ProductCard = ({
    id = "1",
    name = "Product Name",
    price = "999.0",
    imgUrl,
  }) => (
    <Link to={`/product/${id}`} className="block">
      <div className="bg-white p-2 rounded-sm border border-transparent hover:border-gray-100 hover:shadow-md transition-all cursor-pointer group">
        <div className="bg-gray-50 aspect-square mb-2 overflow-hidden rounded-sm">
          <img
            src={
              imgUrl ||
              "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?q=80&w=400&auto=format&fit=crop"
            }
            alt={name}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
        </div>
        <p className="text-[10px] text-gray-400 mb-0.5 font-normal">
          Store Name
        </p>
        <h4 className="text-[11px] font-medium text-gray-800 leading-tight truncate uppercase">
          {name}
        </h4>
        <p className="text-[#FF851B] font-semibold text-xs mt-0.5">₱{price}</p>
        <div className="flex text-yellow-400 text-[8px] mt-1">
          ★★★★★ <span className="text-gray-300 ml-1">(0)</span>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="max-w-[1400px] mx-auto p-4 lg:p-6 space-y-6 bg-white">
      {/* HERO SECTION: Fixed height (320px) to prevent overlap and keep it professional */}
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

        {/* Side Banners (25% width) - UPDATED TO LINKS */}
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
              src="https://images.unsplash.com/photo-1454165833767-027ffea9e778?q=80&w=600&auto=format&fit=crop"
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

      {/* FEATURED SECTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <section className="bg-white p-4 border border-gray-100 shadow-sm rounded-sm">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h3 className="font-semibold text-[#003366] text-sm italic italic">
              Featured Products
            </h3>
            <Link
              to="/products"
              className="text-[10px] text-[#FF851B] font-semibold hover:underline"
            >
              See All
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <ProductCard
              id="bag"
              name="Canvas Tote Bag"
              imgUrl="https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=400&auto=format&fit=crop"
            />
            <ProductCard
              id="shoes"
              name="Nike Running"
              imgUrl="https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=400&auto=format&fit=crop"
            />
            <ProductCard
              id="head"
              name="Wireless Head"
              imgUrl="https://images.unsplash.com/photo-1524678606370-a47ad25cb82a?q=80&w=400&auto=format&fit=crop"
            />
          </div>
        </section>

        <section className="bg-white p-4 border border-gray-100 shadow-sm rounded-sm">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h3 className="font-semibold text-[#003366] text-sm italic italic">
              Featured Services
            </h3>
            <Link
              to="/services"
              className="text-[10px] text-[#FF851B] font-semibold hover:underline"
            >
              See All &gt;
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <ProductCard
              id="design"
              name="Graphic Design"
              imgUrl="https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=400&auto=format&fit=crop"
            />
            <ProductCard
              id="photo"
              name="Photography"
              imgUrl="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=400&auto=format&fit=crop"
            />
            <ProductCard
              id="tutor"
              name="Tutoring"
              imgUrl="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=400&auto=format&fit=crop"
            />
          </div>
        </section>
      </div>

      {/* CATEGORIES */}
      <section className="bg-white border border-gray-100 shadow-sm rounded-sm">
        <div className="bg-gray-50/50 py-3 border-b border-gray-100 text-center">
          <h3 className="font-semibold text-gray-500 text-xs uppercase tracking-widest italic italic">
            CATEGORIES
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
            <div
              key={i}
              className="border-r border-b border-gray-100 p-8 flex flex-col items-center gap-3 hover:bg-gray-50 transition-colors cursor-pointer group"
            >
              <div className="w-14 h-14 flex items-center justify-center transition-transform group-hover:scale-110">
                <img
                  src={`https://img.icons8.com/ios-filled/100/003366/${i % 2 === 0 ? "hamburger" : "necklace"}.png`}
                  alt="Category"
                />
              </div>
              <span className="text-[11px] font-semibold text-gray-600">
                Category {i}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ON SALE NOW */}
      <section className="bg-white p-4 border border-gray-100 shadow-sm rounded-sm">
        <div className="flex items-center gap-4 mb-5 border-b pb-2">
          <h3 className="font-semibold text-[#FF851B] text-sm italic italic">
            On Sale Now
          </h3>
          <div className="flex gap-1.5">
            {["12", "50", "10"].map((time, idx) => (
              <span
                key={idx}
                className="bg-[#FF0000] text-white text-[11px] font-bold px-2 py-0.5 rounded-sm shadow-sm"
              >
                {time}
              </span>
            ))}
          </div>
          <button className="ml-auto text-[10px] text-[#FF851B] font-semibold hover:underline">
            See All &gt;
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <ProductCard key={i} id={`sale-${i}`} />
          ))}
        </div>
      </section>

      {/* DAILY DISCOVERY */}
      <section>
        <div className="bg-gray-50/50 py-3 border-t border-gray-100 mb-8 text-center rounded-sm">
          <h3 className="font-semibold text-[#FF851B] text-sm uppercase tracking-[0.2em] italic italic">
            DAILY DISCOVERY
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
            <ProductCard
              key={i}
              id={`discovery-${i}`}
              imgUrl={`https://picsum.photos/seed/${i + 50}/400/400`}
            />
          ))}
        </div>
        <div className="mt-12 flex justify-center">
          <button className="border border-[#FF851B] text-[#FF851B] px-16 py-2.5 text-[11px] font-bold hover:bg-[#FF851B] hover:text-white transition-all uppercase tracking-widest shadow-sm rounded-sm">
            Load More
          </button>
        </div>
      </section>
    </div>
  );
}
