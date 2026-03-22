import React, { useState, useMemo } from "react";
import {
  Search,
  Star,
  ShieldAlert,
  CheckCircle2,
  Trash2,
  HelpCircle,
  MessageSquare,
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  AlertCircle,
  Send,
  CheckCircle,
  Eye,
} from "lucide-react";

export default function ReviewModeration() {
  // --- STATE ---
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [ratingFilter, setRatingFilter] = useState("All Ratings");
  const [dateFilter, setDateFilter] = useState("All Time");

  const [selectedReview, setSelectedReview] = useState(null); // Used for View & Inquiry
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [inquiryText, setInquiryText] = useState("");
  const [notification, setNotification] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Mock Data
  const [reviews, setReviews] = useState([
    {
      id: "REV-101",
      user: "Juan Dela Cruz",
      product: "iPhone 15 Pro Max",
      rating: 5,
      comment:
        "Super smooth transaction! Authentic item. The seller was very responsive to my inquiries and the packaging was top-notch. Highly recommended for students looking for genuine gadgets!",
      status: "Published",
      flagReason: null,
      date: "2026-03-22",
    },
    {
      id: "REV-102",
      user: "AnonyMouse",
      product: "Ergonomic Chair",
      rating: 1,
      comment:
        "THIS IS A SCAM!!! DO NOT BUY!!! I REPEAT DO NOT BUY FROM THIS MERCHANT!!!",
      status: "Flagged",
      flagReason: "Potential Spam",
      date: "2026-03-21",
    },
    {
      id: "REV-103",
      user: "Maria Santos",
      product: "Vintage Backpack",
      rating: 4,
      comment:
        "Good quality, but color is slightly different. It looks more brown than tan in person, but the leather feels premium.",
      status: "Pending",
      flagReason: null,
      date: "2026-03-22",
    },
    {
      id: "REV-104",
      user: "Kyle G.",
      product: "G-Pro Keyboard",
      rating: 2,
      comment:
        "Seller was very rude. Product is okay but the experience was bad.",
      status: "Flagged",
      flagReason: "Harassment",
      date: "2026-03-20",
    },
    {
      id: "REV-105",
      user: "Liza Soberano",
      product: "Samsung S24 Ultra",
      rating: 5,
      comment: "Best purchase this year! IskoMart really helps us save money.",
      status: "Published",
      flagReason: null,
      date: "2026-03-22",
    },
  ]);

  // --- HANDLERS ---
  const triggerToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleStatusChange = (id, newStatus) => {
    setReviews((prev) =>
      prev.map((rev) =>
        rev.id === id
          ? {
              ...rev,
              status: newStatus,
              flagReason: newStatus === "Published" ? null : rev.flagReason,
            }
          : rev,
      ),
    );
    triggerToast(`Review ${id} moved to ${newStatus}`);
    setShowViewModal(false); // Close detail modal if open
  };

  // --- FILTERING ---
  const filteredReviews = useMemo(() => {
    return reviews.filter((rev) => {
      const matchesSearch =
        rev.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rev.product.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "All Status" || rev.status === statusFilter;
      const matchesRating =
        ratingFilter === "All Ratings" ||
        rev.rating.toString() === ratingFilter;
      return matchesSearch && matchesStatus && matchesRating;
    });
  }, [reviews, searchTerm, statusFilter, ratingFilter]);

  const totalPages = Math.ceil(filteredReviews.length / itemsPerPage);
  const paginatedReviews = filteredReviews.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20 relative">
      {/* --- NOTIFICATION --- */}
      {notification && (
        <div className="fixed top-10 right-10 z-[200] bg-[#003366] text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right">
          <CheckCircle size={18} className="text-green-400" />
          <span className="text-xs font-bold">{notification}</span>
        </div>
      )}

      {/* --- VIEW DETAIL MODAL --- */}
      {showViewModal && selectedReview && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[40px] w-full max-w-lg p-10 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-xl font-black text-[#003366]">
                  {selectedReview.user}
                </h3>
                <p className="text-xs font-bold text-gray-400 uppercase">
                  {selectedReview.date} • {selectedReview.product}
                </p>
              </div>
              <button
                onClick={() => setShowViewModal(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex items-center gap-1 mb-6">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={18}
                  className={
                    i < selectedReview.rating
                      ? "text-orange-400 fill-current"
                      : "text-gray-200"
                  }
                />
              ))}
              <span className="ml-2 text-sm font-bold text-[#003366]">
                {selectedReview.rating}/5
              </span>
            </div>

            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 mb-8">
              <p className="text-sm text-[#003366] leading-relaxed italic">
                "{selectedReview.comment}"
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() =>
                  handleStatusChange(selectedReview.id, "Published")
                }
                className="flex-grow py-4 bg-[#003366] text-white rounded-2xl text-xs font-bold hover:bg-[#002244] transition-all"
              >
                Approve Review
              </button>
              <button
                onClick={() => handleStatusChange(selectedReview.id, "Removed")}
                className="flex-grow py-4 bg-red-50 text-red-500 rounded-2xl text-xs font-bold hover:bg-red-100 transition-all"
              >
                Remove Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- INQUIRY MODAL --- */}
      {showInquiryModal && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[40px] w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-[#003366]">
                Request More Info
              </h3>
              <button
                onClick={() => setShowInquiryModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <textarea
              className="w-full h-32 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-100 mb-6"
              placeholder={`Send a message to ${selectedReview?.user}...`}
              value={inquiryText}
              onChange={(e) => setInquiryText(e.target.value)}
            />
            <button
              onClick={() => {
                triggerToast(`Inquiry sent to ${selectedReview.user}`);
                setShowInquiryModal(false);
              }}
              className="w-full py-4 bg-[#003366] text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2"
            >
              <Send size={14} /> Send Message
            </button>
          </div>
        </div>
      )}

      {/* --- FILTERS --- */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="relative flex-grow lg:max-w-md">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            size={16}
          />
          <input
            type="text"
            placeholder="Search reviews..."
            className="pl-11 pr-6 py-3.5 bg-white border border-gray-100 rounded-2xl text-xs font-semibold text-[#003366] outline-none shadow-sm focus:ring-2 focus:ring-blue-50 w-full transition-all"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <FilterSelect
            label="Status"
            value={statusFilter}
            onChange={(v) => {
              setStatusFilter(v);
              setCurrentPage(1);
            }}
            options={[
              "All Status",
              "Published",
              "Pending",
              "Flagged",
              "Removed",
            ]}
          />
          <FilterSelect
            label="Rating"
            value={ratingFilter}
            onChange={(v) => {
              setRatingFilter(v);
              setCurrentPage(1);
            }}
            options={["All Ratings", "5", "4", "3", "2", "1"]}
          />
        </div>
      </div>

      {/* --- TABLE --- */}
      <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#F9FAFB] border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-[2px]">
              <tr>
                <th className="px-8 py-5">Reviewer</th>
                <th className="px-8 py-5">Product</th>
                <th className="px-8 py-5 text-center">Rating</th>
                <th className="px-8 py-5">Comment</th>
                <th className="px-8 py-5">Flag Reason</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedReviews.map((rev) => (
                <tr
                  key={rev.id}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-8 py-6">
                    <p className="text-xs font-bold text-[#003366]">
                      {rev.user}
                    </p>
                    <p className="text-[9px] text-gray-400 font-bold">
                      {rev.date}
                    </p>
                  </td>
                  <td className="px-8 py-6 text-xs font-semibold text-slate-500">
                    {rev.product}
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex justify-center items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={10}
                          className={
                            i < rev.rating
                              ? "text-orange-400 fill-current"
                              : "text-gray-200"
                          }
                        />
                      ))}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-xs text-slate-400 italic line-clamp-1 max-w-[200px]">
                      "{rev.comment}"
                    </p>
                  </td>
                  <td className="px-8 py-6">
                    {rev.flagReason ? (
                      <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-500 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase">
                        <AlertCircle size={10} /> {rev.flagReason}
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-300 font-bold uppercase italic tracking-tighter">
                        Clean
                      </span>
                    )}
                  </td>
                  <td className="px-8 py-6">
                    {/* ALWAYS VISIBLE ACTIONS */}
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setSelectedReview(rev);
                          setShowViewModal(true);
                        }}
                        className="p-2.5 bg-slate-50 text-slate-400 hover:bg-[#003366] hover:text-white rounded-xl transition-all shadow-sm"
                        title="View Full Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleStatusChange(rev.id, "Published")}
                        className="p-2.5 bg-green-50 text-green-500 hover:bg-green-500 hover:text-white rounded-xl transition-all shadow-sm"
                        title="Approve"
                      >
                        <CheckCircle2 size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedReview(rev);
                          setShowInquiryModal(true);
                        }}
                        className="p-2.5 bg-blue-50 text-blue-500 hover:bg-blue-500 hover:text-white rounded-xl transition-all shadow-sm"
                        title="Ask More Info"
                      >
                        <HelpCircle size={16} />
                      </button>
                      <button
                        onClick={() => handleStatusChange(rev.id, "Removed")}
                        className="p-2.5 bg-red-50 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-sm"
                        title="Remove"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function FilterSelect({ label, value, options, onChange }) {
  return (
    <div className="bg-white px-4 py-2.5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
        {label}:
      </span>
      <select
        className="text-xs font-bold text-[#003366] bg-transparent outline-none cursor-pointer"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}
