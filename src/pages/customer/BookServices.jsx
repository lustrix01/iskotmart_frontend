import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronRight,
  ChevronDown,
  List as ListIcon,
  Star,
  ShieldCheck,
  ChevronLeft,
  Wrench,
} from "lucide-react";

export default function BookServices() {
  const [activeSort, setActiveSort] = useState("Highest Rated");

  // Mock Data: Verified Freelancers/Service Providers
  const freelancers = [
    {
      id: 1,
      name: "Maria (Math Tutor)",
      img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=150",
    },
    {
      id: 2,
      name: "Dave (Tech Repair)",
      img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150",
    },
    {
      id: 3,
      name: "Sarah (Designer)",
      img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150",
    },
    {
      id: 4,
      name: "John (Errands)",
      img: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150",
    },
    {
      id: 5,
      name: "Ana (Proofreading)",
      img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150",
    },
    {
      id: 6,
      name: "Mark (Photography)",
      img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150",
    },
  ];

  // Mock Data: Services
  const services = Array(15)
    .fill()
    .map((_, i) => ({
      id: i + 1,
      name:
        i % 2 === 0
          ? "College Algebra Tutoring (1 Hour)"
          : "Custom Logo Design",
      price: i % 2 === 0 ? 250.0 : 800.0,
      rateType: i % 2 === 0 ? "per hour" : "per project",
      rating: 4.9,
      completed: "120+",
      img:
        i % 2 === 0
          ? "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=300"
          : "https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=300",
    }));

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
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm mb-6 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-50 flex justify-between items-center bg-[#F8FAFC]">
            <div className="flex items-center gap-2 text-[#003366]">
              <ShieldCheck size={18} className="text-[#0074D9]" />
              <h2 className="text-sm font-bold">
                Verified student freelancers
              </h2>
            </div>
            <Link
              to="#"
              className="text-[11px] font-bold text-[#0074D9] flex items-center gap-1 hover:underline"
            >
              See all <ChevronRight size={12} />
            </Link>
          </div>

          <div className="p-5 flex gap-6 overflow-x-auto no-scrollbar">
            {freelancers.map((person) => (
              <Link
                key={person.id}
                to="#"
                className="flex flex-col items-center gap-2 min-w-[100px] group"
              >
                <div className="w-20 h-20 rounded-full border-2 border-transparent group-hover:border-[#0074D9] p-0.5 transition-all duration-300">
                  <div className="w-full h-full rounded-full overflow-hidden bg-gray-100 shadow-sm">
                    <img
                      src={person.img}
                      alt={person.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
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
                {[
                  "Academics & Tutoring",
                  "Graphic Design",
                  "Tech Support",
                  "Errands & Tasks",
                ].map((cat) => (
                  <div key={cat} className="mb-1">
                    <button className="w-full flex justify-between items-center px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 hover:text-[#003366] rounded-lg transition-colors group">
                      <span className="flex items-center gap-2">
                        <ChevronRight
                          size={14}
                          className="text-gray-300 group-hover:text-[#0074D9] transition-colors"
                        />
                        {cat}
                      </span>
                    </button>
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
                      onClick={() => setActiveSort(sort)}
                      className={`px-5 py-2 text-xs font-bold rounded-md transition-all ${
                        activeSort === sort
                          ? "bg-[#0074D9] text-white shadow-md shadow-blue-100"
                          : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {sort}
                    </button>
                  ))}
                  <button className="px-4 py-2 bg-white text-gray-600 border border-gray-200 text-xs font-bold rounded-md flex items-center gap-2 hover:bg-gray-50 transition-all">
                    Rate <ChevronDown size={14} />
                  </button>
                </div>
              </div>

              {/* Pagination */}
              <div className="flex items-center gap-3 mr-2">
                <span className="text-[11px] font-bold">
                  <span className="text-[#0074D9]">1</span> / 5
                </span>
                <div className="flex gap-1">
                  <button className="w-7 h-7 flex items-center justify-center bg-white border border-gray-200 rounded text-gray-400 hover:bg-gray-50">
                    <ChevronLeft size={14} />
                  </button>
                  <button className="w-7 h-7 flex items-center justify-center bg-white border border-gray-200 rounded text-gray-600 hover:bg-gray-50">
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Service Grid (5 Columns) */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {services.map((item) => (
                <Link
                  to={`/service/${item.id}`}
                  key={item.id}
                  className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-xl hover:border-[#0074D9]/30 transition-all duration-300 group flex flex-col"
                >
                  {/* Image with Tool Icon Badge */}
                  <div className="aspect-square bg-gray-50 relative overflow-hidden">
                    <img
                      src={item.img}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
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
              ))}
            </div>

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
