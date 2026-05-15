import React from "react";
import { Link } from "react-router-dom";
import { Heart, ChevronRight, ShoppingBag, Wrench } from "lucide-react";

export default function Wishlist() {
  const wishlistItems = [];

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-500">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#003366]">My Wishlist</h1>
        <p className="text-xs text-gray-400 mt-1">
          Products and services you saved for later.
        </p>
      </div>

      {wishlistItems.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-10 text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-[#F8FAFC] border border-gray-100 flex items-center justify-center mb-4">
            <Heart size={24} className="text-[#FF851B]" />
          </div>
          <h2 className="text-base font-bold text-[#003366]">Your wishlist is empty</h2>
          <p className="text-xs text-gray-500 mt-2 max-w-md mx-auto">
            Start browsing the catalog and save items to track products and services you want to buy or book.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#003366] text-white text-xs font-bold rounded-md hover:bg-[#002244] transition-colors"
            >
              <ShoppingBag size={14} />
              Browse Products
              <ChevronRight size={14} />
            </Link>
            <Link
              to="/services"
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-200 text-[#003366] text-xs font-bold rounded-md hover:bg-gray-50 transition-colors"
            >
              <Wrench size={14} />
              Browse Services
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
