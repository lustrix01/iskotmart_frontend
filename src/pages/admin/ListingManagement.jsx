import React, { useState, useMemo } from "react";
import {
  Search,
  Package,
  Store,
  Eye,
  Power,
  PowerOff,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Clock,
  Tag,
  CheckCircle2,
  X,
  Info,
} from "lucide-react";

export default function ListingManagement() {
  // --- STATE ---
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [merchantFilter, setMerchantFilter] = useState("All Merchants");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [notification, setNotification] = useState(null);
  const itemsPerPage = 5;

  // Mock Data
  const [listings, setListings] = useState([
    {
      id: "PRD-001",
      name: "iPhone 15 Pro Max",
      category: "Electronics",
      merchant: "TechHub Store",
      price: 75990,
      stock: 12,
      status: "Active",
      image:
        "https://images.unsplash.com/photo-1696446701796-da61225697cc?w=400&h=400&fit=crop",
      desc: "The latest iPhone with A17 Pro chip and titanium design.",
    },
    {
      id: "PRD-002",
      name: "Ergonomic Office Chair",
      category: "Home & Living",
      merchant: "Comfort Home",
      price: 4500,
      stock: 0,
      status: "Out of Stock",
      image:
        "https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=400&h=400&fit=crop",
      desc: "High-back mesh chair with lumbar support.",
    },
    {
      id: "PRD-003",
      name: "Vintage Canvas Backpack",
      category: "Fashion",
      merchant: "Fashion Express",
      price: 1200,
      stock: 45,
      status: "Pending",
      image:
        "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop",
      desc: "Durable canvas backpack for daily commute.",
    },
    {
      id: "PRD-004",
      name: "Mechanical Keyboard G-Pro",
      category: "Electronics",
      merchant: "TechHub Store",
      price: 3200,
      stock: 8,
      status: "Deactivated",
      image:
        "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=400&h=400&fit=crop",
      desc: "Tactile switches with customizable RGB lighting.",
    },
    {
      id: "PRD-005",
      name: "Wireless Noise Cancelling Headphones",
      category: "Electronics",
      merchant: "TechHub Store",
      price: 15000,
      stock: 5,
      status: "Active",
      image:
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
      desc: "Industry-leading noise cancellation.",
    },
  ]);

  // --- HANDLERS ---
  const triggerNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleToggleStatus = (id) => {
    setListings((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newStatus =
            item.status === "Deactivated" ? "Active" : "Deactivated";
          triggerNotification(`${item.name} is now ${newStatus}`);
          return { ...item, status: newStatus };
        }
        return item;
      }),
    );
  };

  // --- FILTER & PAGINATION LOGIC ---
  const filteredListings = useMemo(() => {
    return listings.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCat =
        categoryFilter === "All Categories" || item.category === categoryFilter;
      const matchesStatus =
        statusFilter === "All Status" || item.status === statusFilter;
      const matchesMerchant =
        merchantFilter === "All Merchants" || item.merchant === merchantFilter;
      return matchesSearch && matchesCat && matchesStatus && matchesMerchant;
    });
  }, [listings, searchTerm, categoryFilter, statusFilter, merchantFilter]);

  const totalPages = Math.ceil(filteredListings.length / itemsPerPage);
  const paginatedListings = filteredListings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20 relative">
      {/* --- NOTIFICATION TOAST --- */}
      {notification && (
        <div className="fixed top-10 right-10 z-[200] bg-[#003366] text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right-full">
          <CheckCircle2 size={20} className="text-green-400" />
          <span className="text-xs font-bold">{notification}</span>
        </div>
      )}

      {/* --- VIEW DETAIL MODAL --- */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[40px] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="relative h-48 bg-slate-100">
              <img
                src={selectedProduct.image}
                className="w-full h-full object-cover"
                alt=""
              />
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-6 right-6 p-2 bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-white/40"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-10 space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-black text-[#003366]">
                    {selectedProduct.name}
                  </h2>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    {selectedProduct.id} • {selectedProduct.category}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-blue-600">
                    ₱{selectedProduct.price.toLocaleString()}
                  </p>
                  <StatusBadge status={selectedProduct.status} />
                </div>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">
                {selectedProduct.desc}
              </p>
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="p-4 bg-slate-50 rounded-2xl flex items-center gap-4">
                  <Store className="text-gray-400" size={20} />
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">
                      Merchant
                    </p>
                    <p className="text-xs font-bold text-[#003366]">
                      {selectedProduct.merchant}
                    </p>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl flex items-center gap-4">
                  <Package className="text-gray-400" size={20} />
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">
                      Stock Level
                    </p>
                    <p className="text-xs font-bold text-[#003366]">
                      {selectedProduct.stock} Units Available
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- QUICK METRICS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          onClick={() => setStatusFilter("All Status")}
          className="cursor-pointer"
        >
          <MetricCard
            title="Total Listings"
            value={listings.length}
            icon={<Package className="text-blue-500" />}
          />
        </div>
        <div
          onClick={() => setStatusFilter("Pending")}
          className="cursor-pointer"
        >
          <MetricCard
            title="Pending Review"
            value={listings.filter((i) => i.status === "Pending").length}
            icon={<Clock className="text-orange-500" />}
          />
        </div>
        <div
          onClick={() => setStatusFilter("Out of Stock")}
          className="cursor-pointer"
        >
          <MetricCard
            title="Out of Stock"
            value={listings.filter((i) => i.stock === 0).length}
            icon={<AlertTriangle className="text-red-500" />}
          />
        </div>
      </div>

      {/* --- FILTERS --- */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="relative flex-grow lg:max-w-md">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            size={16}
          />
          <input
            type="text"
            placeholder="Search product name or ID..."
            className="pl-11 pr-6 py-3 bg-white border border-gray-100 rounded-2xl text-xs font-semibold text-[#003366] outline-none shadow-sm focus:ring-2 focus:ring-blue-50 w-full transition-all"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <FilterSelect
            label="Category"
            value={categoryFilter}
            onChange={(v) => {
              setCategoryFilter(v);
              setCurrentPage(1);
            }}
            options={[
              "All Categories",
              "Electronics",
              "Fashion",
              "Home & Living",
            ]}
          />
          <FilterSelect
            label="Status"
            value={statusFilter}
            onChange={(v) => {
              setStatusFilter(v);
              setCurrentPage(1);
            }}
            options={[
              "All Status",
              "Active",
              "Pending",
              "Deactivated",
              "Out of Stock",
            ]}
          />
          <FilterSelect
            label="Merchant"
            value={merchantFilter}
            onChange={(v) => {
              setMerchantFilter(v);
              setCurrentPage(1);
            }}
            options={[
              "All Merchants",
              "TechHub Store",
              "Comfort Home",
              "Fashion Express",
            ]}
          />
        </div>
      </div>

      {/* --- LISTINGS TABLE --- */}
      <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#F9FAFB] border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-[2px]">
              <tr>
                <th className="px-8 py-5">Product</th>
                <th className="px-8 py-5">Merchant</th>
                <th className="px-8 py-5">Price</th>
                <th className="px-8 py-5">Stock</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedListings.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50/50 transition-colors group"
                >
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-12 h-12 rounded-xl object-cover border border-gray-100"
                      />
                      <div>
                        <p className="text-xs font-bold text-[#003366]">
                          {item.name}
                        </p>
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">
                          {item.id} • {item.category}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                      <Store size={14} className="text-gray-300" />
                      {item.merchant}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-xs font-bold text-[#003366]">
                    ₱{item.price.toLocaleString()}
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold ${item.stock < 5 ? "text-red-500" : "text-slate-600"}`}
                      >
                        {item.stock}
                      </span>
                      {item.stock < 5 && (
                        <span className="text-[8px] font-black bg-red-50 text-red-500 px-1.5 py-0.5 rounded uppercase">
                          Low
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        className="p-2 hover:bg-blue-50 text-blue-500 rounded-lg transition-colors"
                        onClick={() => setSelectedProduct(item)}
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(item.id)}
                        className={`p-2 rounded-lg transition-colors ${item.status === "Deactivated" ? "hover:bg-green-50 text-green-500" : "hover:bg-red-50 text-red-400"}`}
                      >
                        {item.status === "Deactivated" ? (
                          <Power size={16} />
                        ) : (
                          <PowerOff size={16} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* --- PAGINATION FOOTER --- */}
        <div className="bg-[#F9FAFB] px-8 py-6 border-t border-gray-100 flex items-center justify-between">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Showing {paginatedListings.length} of {filteredListings.length}{" "}
            Listings
          </p>
          <div className="flex items-center gap-4">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => prev - 1)}
              className="flex items-center gap-2 text-[10px] font-black uppercase text-[#003366] disabled:opacity-30"
            >
              <ChevronLeft size={16} /> Prev
            </button>
            <div className="flex gap-2">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-8 h-8 rounded-xl text-[10px] font-bold transition-all ${currentPage === i + 1 ? "bg-[#003366] text-white" : "bg-white border border-gray-100 text-gray-400"}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => prev + 1)}
              className="flex items-center gap-2 text-[10px] font-black uppercase text-[#003366] disabled:opacity-30"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {filteredListings.length === 0 && (
          <div className="py-20 text-center">
            <Package size={48} className="mx-auto text-gray-100 mb-4" />
            <p className="text-gray-400 font-bold text-sm">
              No products matching your filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS (Keep these same as your original) ---
function MetricCard({ title, value, icon }) {
  return (
    <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center justify-between hover:border-blue-200 transition-all active:scale-95">
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
          {title}
        </p>
        <p className="text-2xl font-black text-[#003366]">{value}</p>
      </div>
      <div className="bg-slate-50 p-4 rounded-2xl">{icon}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = {
    Active: "bg-green-50 text-green-600 border-green-100",
    Pending: "bg-orange-50 text-orange-600 border-orange-100",
    Deactivated: "bg-slate-100 text-slate-500 border-slate-200",
    "Out of Stock": "bg-red-50 text-red-600 border-red-100",
  };
  return (
    <span
      className={`px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-wider ${colors[status]}`}
    >
      {status}
    </span>
  );
}

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
