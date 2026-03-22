import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronRight,
  ChevronDown,
  List as ListIcon,
  Star,
  ShieldCheck,
  ChevronLeft,
} from "lucide-react";

export default function ShopProducts() {
  const [activeSort, setActiveSort] = useState("Popular");

  // Mock Data: Verified Merchants
  const merchants = [
    {
      id: 1,
      name: "TechHub Electronics",
      img: "https://images.unsplash.com/photo-1555680202-c86f0e12f086?q=80&w=150",
    },
    {
      id: 2,
      name: "Student Snacks",
      img: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=150",
    },
    {
      id: 3,
      name: "Dorm Essentials",
      img: "https://images.unsplash.com/photo-1522771731535-61df24312214?q=80&w=150",
    },
    {
      id: 4,
      name: "Campus Kicks",
      img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=150",
    },
    {
      id: 5,
      name: "Art Supplies",
      img: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=150",
    },
    {
      id: 6,
      name: "Study Notes Hub",
      img: "https://images.unsplash.com/photo-1456324504439-367cee3b3c32?q=80&w=150",
    },
  ];

  // Mock Data: Products
  const products = Array(15)
    .fill()
    .map((_, i) => ({
      id: i + 1,
      name: i % 2 === 0 ? "Premium Campus Sandwich" : "Wireless Mouse",
      price: 999.0,
      oldPrice: 1200.0,
      discount: "-12%",
      rating: 4.8,
      sold: "1.2k",
      img:
        i % 2 === 0
          ? "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?q=80&w=300"
          : "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=300",
    }));

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
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm mb-6 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-50 flex justify-between items-center bg-[#F8FAFC]">
            <div className="flex items-center gap-2 text-[#003366]">
              <ShieldCheck size={18} className="text-[#FF851B]" />
              <h2 className="text-sm font-bold">Verified merchants</h2>
            </div>
            <Link
              to="#"
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
                {[1, 2, 3, 4].map((cat) => (
                  <div key={cat} className="mb-1">
                    <button className="w-full flex justify-between items-center px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 hover:text-[#003366] rounded-lg transition-colors group">
                      <span className="flex items-center gap-2">
                        <ChevronRight
                          size={14}
                          className="text-gray-300 group-hover:text-[#FF851B] transition-colors"
                        />
                        Category {cat}
                      </span>
                    </button>
                    {/* Subcategories */}
                    <div className="pl-10 pr-4 py-1 space-y-2">
                      <Link
                        to="#"
                        className="block text-[11px] text-gray-500 hover:text-[#FF851B] transition-colors"
                      >
                        Subcategory 1
                      </Link>
                      <Link
                        to="#"
                        className="block text-[11px] text-gray-500 hover:text-[#FF851B] transition-colors"
                      >
                        Subcategory 2
                      </Link>
                      <Link
                        to="#"
                        className="block text-[11px] text-gray-500 hover:text-[#FF851B] transition-colors"
                      >
                        Subcategory 3
                      </Link>
                    </div>
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
                      onClick={() => setActiveSort(sort)}
                      className={`px-5 py-2 text-xs font-bold rounded-md transition-all ${
                        activeSort === sort
                          ? "bg-[#FF851B] text-white shadow-md shadow-orange-100"
                          : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {sort}
                    </button>
                  ))}
                  <button className="px-4 py-2 bg-white text-gray-600 border border-gray-200 text-xs font-bold rounded-md flex items-center gap-2 hover:bg-gray-50 transition-all">
                    Price <ChevronDown size={14} />
                  </button>
                </div>
              </div>

              {/* Pagination (Top) */}
              <div className="flex items-center gap-3 mr-2">
                <span className="text-[11px] font-bold">
                  <span className="text-[#FF851B]">1</span> / 8
                </span>
                <div className="flex gap-1">
                  <button className="w-7 h-7 flex items-center justify-center bg-white border border-gray-200 rounded text-gray-400 hover:bg-gray-50 transition-colors">
                    <ChevronLeft size={14} />
                  </button>
                  <button className="w-7 h-7 flex items-center justify-center bg-white border border-gray-200 rounded text-gray-600 hover:bg-gray-50 transition-colors">
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Product Grid (5 Columns) */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {products.map((item) => (
                <Link
                  to={`/product/${item.id}`}
                  key={item.id}
                  className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-xl hover:border-[#FF851B]/30 transition-all duration-300 group flex flex-col"
                >
                  {/* Image */}
                  <div className="aspect-square bg-gray-50 relative overflow-hidden">
                    <img
                      src={item.img}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
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
                          <Star
                            size={10}
                            fill="#FF851B"
                            className="text-[#FF851B]"
                          />
                          <Star
                            size={10}
                            fill="#FF851B"
                            className="text-[#FF851B]"
                          />
                          <Star
                            size={10}
                            fill="#FF851B"
                            className="text-[#FF851B]"
                          />
                          <Star
                            size={10}
                            fill="#FF851B"
                            className="text-[#FF851B]"
                          />
                        </div>
                        <span className="text-[9px] text-gray-400 font-medium">
                          {item.sold} sold
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

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
