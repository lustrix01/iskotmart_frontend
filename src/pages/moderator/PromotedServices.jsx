import React, { useState } from "react";
import { Star, Store, ArrowUpRight, CheckCircle, Package } from "lucide-react";

export default function PromotedServices() {
  const [notification, setNotification] = useState(null);
  const [listings, setListings] = useState([
    {
      id: "P-001",
      name: "iPhone 15 Pro",
      merchant: "TechHub",
      price: "75,000",
      isFeatured: true,
      img: "https://images.unsplash.com/photo-1696446701796-da61225697cc?w=100&h=100&fit=crop",
    },
    {
      id: "P-002",
      name: "Ergonomic Chair",
      merchant: "ComfortHome",
      price: "4,500",
      isFeatured: false,
      img: "https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=100&h=100&fit=crop",
    },
    {
      id: "P-003",
      name: "Backpack",
      merchant: "FashionEx",
      price: "1,200",
      isFeatured: true,
      img: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=100&h=100&fit=crop",
    },
  ]);

  const toggleFeature = (id) => {
    setListings((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newState = !item.isFeatured;
          setNotification(
            `${item.name} ${newState ? "promoted to front" : "removed from features"}`,
          );
          setTimeout(() => setNotification(null), 3000);
          return { ...item, isFeatured: newState };
        }
        return item;
      }),
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {notification && (
        <div className="fixed top-24 right-10 z-[200] bg-[#FF851B] text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right">
          <CheckCircle size={16} />
          <span className="text-xs font-bold">{notification}</span>
        </div>
      )}

      <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-[#003366]">
            Promotional spotlight
          </h3>
          <p className="text-xs text-gray-400 font-medium mt-1">
            Select items to feature on the IskoMart homepage.
          </p>
        </div>
        <div className="bg-orange-50 px-6 py-3 rounded-2xl border border-orange-100">
          <p className="text-xl font-bold text-[#FF851B]">
            {listings.filter((l) => l.isFeatured).length}{" "}
            <span className="text-xs text-orange-300 font-medium">
              / 10 Slots
            </span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {listings.map((item) => (
          <div
            key={item.id}
            className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm transition-all group overflow-hidden"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="w-16 h-16 rounded-2xl overflow-hidden border border-gray-100">
                <img
                  src={item.img}
                  className="w-full h-full object-cover"
                  alt=""
                />
              </div>
              <button
                onClick={() => toggleFeature(item.id)}
                className={`p-3 rounded-xl transition-all shadow-sm ${
                  item.isFeatured
                    ? "bg-[#FF851B] text-white"
                    : "bg-gray-50 text-gray-300 hover:text-[#FF851B]"
                }`}
              >
                <Star
                  size={20}
                  fill={item.isFeatured ? "currentColor" : "none"}
                />
              </button>
            </div>

            <h4 className="text-sm font-bold text-[#003366] mb-1">
              {item.name}
            </h4>
            <p className="text-[10px] text-gray-400 font-bold uppercase mb-4 flex items-center gap-2">
              <Store size={12} /> {item.merchant}
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
              <p className="text-xs font-bold text-[#003366]">₱{item.price}</p>
              <span
                className={`text-[8px] font-black uppercase px-2 py-1 rounded-md ${item.isFeatured ? "bg-orange-50 text-[#FF851B]" : "bg-gray-50 text-gray-400"}`}
              >
                {item.isFeatured ? "Featured" : "Standard"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
