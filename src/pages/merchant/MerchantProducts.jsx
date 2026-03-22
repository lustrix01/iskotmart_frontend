import React, { useState } from "react";
import {
  Package,
  Wrench,
  Plus,
  Search,
  Filter,
  Edit3,
  Trash2,
  MoreVertical,
  X,
  Image as ImageIcon,
  Check,
} from "lucide-react";

export default function MerchantProducts() {
  const [activeTab, setActiveTab] = useState("products");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Mock Data
  const [products] = useState([
    {
      id: "P001",
      name: "Premium Campus Sandwich",
      category: "Food",
      price: 99.0,
      stock: 45,
      status: "Active",
      img: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?q=80&w=150",
    },
    {
      id: "P002",
      name: "Wireless Mouse RGB",
      category: "Electronics",
      price: 1200.0,
      stock: 12,
      status: "Active",
      img: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=150",
    },
    {
      id: "P003",
      name: "IskoMart Tote Bag",
      category: "Apparel",
      price: 350.0,
      stock: 0,
      status: "Out of Stock",
      img: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=150",
    },
  ]);

  const [services] = useState([
    {
      id: "S001",
      name: "Graphic Design Service",
      category: "Creative",
      price: 800.0,
      rate: "Per Project",
      status: "Active",
      img: "https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=150",
    },
    {
      id: "S002",
      name: "Math Tutoring (Algebra)",
      category: "Academics",
      price: 250.0,
      rate: "Per Hour",
      status: "Active",
      img: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=150",
    },
  ]);

  const currentItems = activeTab === "products" ? products : services;

  const handleOpenModal = (item = null) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto space-y-6">
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#003366]">
            Inventory Management
          </h2>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-bold opacity-70">
            Total Items: {products.length + services.length}
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-[#FF851B] text-white px-6 py-3 rounded-xl font-bold text-xs shadow-md hover:bg-[#e67616] transition-all active:scale-95"
        >
          <Plus size={18} />
          Add New {activeTab === "products" ? "Product" : "Service"}
        </button>
      </div>

      {/* --- TABS & SEARCH --- */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col lg:flex-row justify-between items-center gap-4">
        <div className="flex bg-gray-50 p-1 rounded-xl w-full lg:w-auto">
          <button
            onClick={() => setActiveTab("products")}
            className={`flex-1 lg:flex-none px-8 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === "products" ? "bg-white text-[#FF851B] shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
          >
            <Package size={16} /> Products
          </button>
          <button
            onClick={() => setActiveTab("services")}
            className={`flex-1 lg:flex-none px-8 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === "services" ? "bg-white text-[#FF851B] shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
          >
            <Wrench size={16} /> Services
          </button>
        </div>

        <div className="flex gap-3 w-full lg:w-auto">
          <div className="relative flex-grow lg:w-80">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300"
              size={16}
            />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-xs focus:ring-2 focus:ring-[#FF851B]/20 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:bg-gray-100 transition-colors">
            <Filter size={18} />
          </button>
        </div>
      </div>

      {/* --- TABLE --- */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-gray-100 text-[10px] font-bold text-[#003366] uppercase tracking-[0.2em]">
                <th className="p-5 pl-8">Item Info</th>
                <th className="p-5">Category</th>
                <th className="p-5">Price</th>
                <th className="p-5">
                  {activeTab === "products" ? "Stock" : "Rate"}
                </th>
                <th className="p-5">Status</th>
                <th className="p-5 pr-8 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-xs font-medium text-gray-600">
              {currentItems.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group"
                >
                  <td className="p-5 pl-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 border border-gray-100 shrink-0">
                        <img
                          src={item.img}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-bold text-[#003366] mb-0.5">
                          {item.name}
                        </p>
                        <p className="text-[10px] text-gray-400 font-mono tracking-tighter uppercase">
                          {item.id}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-5">
                    <span className="px-3 py-1 bg-blue-50 text-[#0074D9] rounded-lg text-[10px] font-bold">
                      {item.category}
                    </span>
                  </td>
                  <td className="p-5 font-bold text-[#003366]">
                    ₱{item.price.toLocaleString()}
                  </td>
                  <td className="p-5">
                    {activeTab === "products" ? (
                      <span
                        className={`font-bold ${item.stock <= 5 ? "text-red-500" : "text-gray-500"}`}
                      >
                        {item.stock}{" "}
                        <span className="text-[10px] font-normal text-gray-400 ml-1">
                          units
                        </span>
                      </span>
                    ) : (
                      <span className="text-gray-500">{item.rate}</span>
                    )}
                  </td>
                  <td className="p-5">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 w-fit ${
                        item.status === "Active"
                          ? "bg-green-50 text-green-600"
                          : "bg-red-50 text-red-500"
                      }`}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${item.status === "Active" ? "bg-green-500" : "bg-red-500"}`}
                      ></div>
                      {item.status}
                    </span>
                  </td>
                  <td className="p-5 pr-8 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleOpenModal(item)}
                        className="p-2.5 text-gray-400 hover:text-[#0074D9] hover:bg-blue-50 rounded-xl transition-all"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
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

      {/* --- ADD/EDIT MODAL (Slide-over Simulation) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-[#003366]/40 backdrop-blur-sm animate-in fade-in"
            onClick={() => setIsModalOpen(false)}
          ></div>

          {/* Modal Content */}
          <div className="relative w-full max-w-lg bg-white h-screen shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-[#003366]">
                {editingItem
                  ? `Edit ${activeTab.slice(0, -1)}`
                  : `Add New ${activeTab.slice(0, -1)}`}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <div className="p-8 flex-grow overflow-y-auto space-y-8">
              {/* Image Upload Area */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                  Item Image
                </label>
                <div className="w-full aspect-video rounded-2xl border-2 border-dashed border-gray-100 bg-gray-50 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-gray-100 transition-all group">
                  {editingItem ? (
                    <img
                      src={editingItem.img}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <>
                      <div className="p-4 bg-white rounded-full text-gray-300 group-hover:text-[#FF851B] transition-colors shadow-sm">
                        <ImageIcon size={32} />
                      </div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">
                        Click to upload photo
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                    Name
                  </label>
                  <input
                    type="text"
                    defaultValue={editingItem?.name}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-[#FF851B] outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                      Category
                    </label>
                    <select className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-[#FF851B] outline-none transition-all appearance-none">
                      <option>Select Category</option>
                      <option selected={editingItem?.category === "Food"}>
                        Food
                      </option>
                      <option
                        selected={editingItem?.category === "Electronics"}
                      >
                        Electronics
                      </option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                      Price (₱)
                    </label>
                    <input
                      type="number"
                      defaultValue={editingItem?.price}
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-[#FF851B] outline-none transition-all"
                    />
                  </div>
                </div>

                {activeTab === "products" ? (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                      Current Stock
                    </label>
                    <input
                      type="number"
                      defaultValue={editingItem?.stock}
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-[#FF851B] outline-none transition-all"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                      Rate Type
                    </label>
                    <select className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-[#FF851B] outline-none transition-all appearance-none">
                      <option selected={editingItem?.rate === "Per Hour"}>
                        Per Hour
                      </option>
                      <option selected={editingItem?.rate === "Per Project"}>
                        Per Project
                      </option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-3.5 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50 transition-all border border-gray-100"
              >
                Cancel
              </button>
              <button className="flex-1 py-3.5 rounded-xl text-xs font-bold text-white bg-[#003366] hover:bg-[#002244] shadow-lg shadow-blue-900/10 transition-all flex items-center justify-center gap-2">
                <Check size={16} />
                {editingItem ? "Save Changes" : "Create Item"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
