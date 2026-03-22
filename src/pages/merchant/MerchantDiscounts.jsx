import React, { useState } from "react";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Tag,
  Calendar,
  Users,
  X,
  CheckCircle,
  AlertCircle,
  ShoppingBag,
  Percent,
} from "lucide-react";

export default function MerchantDiscounts() {
  // --- STATE ---
  const [activeTab, setActiveTab] = useState("vouchers");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // 1. Vouchers Data
  const [vouchers, setVouchers] = useState([
    {
      id: 1,
      code: "ISKO-WELCOME",
      type: "Percentage",
      value: "10%",
      minSpend: "₱200",
      usageLimit: 100,
      used: 45,
      expiry: "2026-05-20",
      status: "Active",
    },
  ]);

  // 2. Product Discounts Data (Direct Markdowns)
  const [productDiscounts, setProductDiscounts] = useState([
    {
      id: 101,
      productName: "Mechanical Keyboard K85",
      originalPrice: 2500,
      discountValue: "20%",
      discountedPrice: 2000,
      expiry: "2026-04-10",
      status: "Active",
    },
    {
      id: 102,
      productName: "Wireless Gaming Mouse",
      originalPrice: 1200,
      discountValue: "₱200",
      discountedPrice: 1000,
      expiry: "2026-04-15",
      status: "Active",
    },
  ]);

  // Form State
  const [formData, setFormData] = useState({
    name: "", // Used for code or productName
    type: "Percentage",
    value: "",
    minSpend: "",
    usageLimit: "",
    expiry: "",
    originalPrice: "",
  });

  // --- HANDLERS ---
  const openModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: activeTab === "vouchers" ? item.code : item.productName,
        ...item,
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: "",
        type: "Percentage",
        value: "",
        minSpend: "",
        usageLimit: "",
        expiry: "",
        originalPrice: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (activeTab === "vouchers") {
      const newVoucher = {
        ...formData,
        code: formData.name,
        id: editingItem?.id || Date.now(),
        status: "Active",
        used: editingItem?.used || 0,
      };
      if (editingItem) {
        setVouchers(
          vouchers.map((v) => (v.id === editingItem.id ? newVoucher : v)),
        );
      } else {
        setVouchers([...vouchers, newVoucher]);
      }
    } else {
      // Logic for calculating discounted price
      const val = parseInt(formData.value.replace(/[^0-9]/g, ""));
      const orig = parseInt(formData.originalPrice);
      const finalPrice =
        formData.type === "Percentage" ? orig - orig * (val / 100) : orig - val;

      const newProdDiscount = {
        ...formData,
        productName: formData.name,
        discountedPrice: finalPrice,
        id: editingItem?.id || Date.now(),
        status: "Active",
      };

      if (editingItem) {
        setProductDiscounts(
          productDiscounts.map((p) =>
            p.id === editingItem.id ? newProdDiscount : p,
          ),
        );
      } else {
        setProductDiscounts([...productDiscounts, newProdDiscount]);
      }
    }
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (activeTab === "vouchers") {
      setVouchers(vouchers.filter((v) => v.id !== deleteId));
    } else {
      setProductDiscounts(productDiscounts.filter((p) => p.id !== deleteId));
    }
    setDeleteId(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#003366]">
            Discounts & Vouchers
          </h2>
          <div className="flex gap-4 mt-2">
            <button
              onClick={() => setActiveTab("vouchers")}
              className={`text-xs font-bold uppercase tracking-widest pb-1 border-b-2 transition-all ${activeTab === "vouchers" ? "border-[#FF851B] text-[#003366]" : "border-transparent text-gray-400 hover:text-gray-600"}`}
            >
              Voucher Codes
            </button>
            <button
              onClick={() => setActiveTab("products")}
              className={`text-xs font-bold uppercase tracking-widest pb-1 border-b-2 transition-all ${activeTab === "products" ? "border-[#FF851B] text-[#003366]" : "border-transparent text-gray-400 hover:text-gray-600"}`}
            >
              Product Discounts
            </button>
          </div>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center justify-center gap-2 bg-[#FF851B] text-white px-6 py-3 rounded-2xl font-bold text-xs shadow-lg shadow-orange-500/20 hover:bg-[#E67716] transition-all transform active:scale-95"
        >
          <Plus size={18} />
          {activeTab === "vouchers" ? "Create Voucher" : "Add Product Discount"}
        </button>
      </div>

      {/* List Container */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[#F9FAFB] border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
            <tr>
              <th className="px-6 py-4">
                {activeTab === "vouchers" ? "Voucher Code" : "Product Name"}
              </th>
              <th className="px-6 py-4">Discount</th>
              <th className="px-6 py-4">
                {activeTab === "vouchers" ? "Usage" : "Current Price"}
              </th>
              <th className="px-6 py-4">Expiry</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {(activeTab === "vouchers" ? vouchers : productDiscounts).map(
              (item) => (
                <tr
                  key={item.id}
                  className="group hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${activeTab === "vouchers" ? "bg-orange-50 text-[#FF851B]" : "bg-blue-50 text-[#003366]"}`}
                      >
                        {activeTab === "vouchers" ? (
                          <Tag size={16} />
                        ) : (
                          <ShoppingBag size={16} />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#003366]">
                          {activeTab === "vouchers"
                            ? item.code
                            : item.productName}
                        </p>
                        <p className="text-[10px] text-gray-400 font-medium">
                          {activeTab === "vouchers"
                            ? `Min: ${item.minSpend}`
                            : `Orig: ₱${item.originalPrice}`}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-sm font-bold text-gray-700">
                    {activeTab === "vouchers" ? item.value : item.discountValue}
                  </td>
                  <td className="px-6 py-5">
                    {activeTab === "vouchers" ? (
                      <p className="text-[10px] text-gray-400 font-bold">
                        {item.used} / {item.usageLimit} Used
                      </p>
                    ) : (
                      <p className="text-sm font-black text-green-600">
                        ₱{item.discountedPrice}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-5 font-bold text-[10px] text-gray-400">
                    {item.expiry}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openModal(item)}
                        className="p-2 text-gray-400 hover:text-[#003366] hover:bg-white rounded-lg shadow-sm"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteId(item.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-white rounded-lg shadow-sm"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>

      {/* --- CREATE/EDIT MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#003366]/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200">
            <div className="p-8 border-b border-gray-50 flex justify-between items-center">
              <h3 className="text-xl font-black text-[#003366]">
                {editingItem ? "Edit" : "New"}{" "}
                {activeTab === "vouchers" ? "Voucher" : "Product Discount"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-8 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block">
                    {activeTab === "vouchers" ? "Voucher Code" : "Product Name"}
                  </label>
                  <input
                    required
                    type="text"
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm outline-none"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                {activeTab === "products" && (
                  <div className="col-span-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block">
                      Original Price (₱)
                    </label>
                    <input
                      required
                      type="number"
                      className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm outline-none"
                      value={formData.originalPrice}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          originalPrice: e.target.value,
                        })
                      }
                    />
                  </div>
                )}
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block">
                    Type
                  </label>
                  <select
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm outline-none"
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                  >
                    <option>Percentage</option>
                    <option>Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block">
                    Value
                  </label>
                  <input
                    required
                    type="text"
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm outline-none"
                    value={formData.value}
                    onChange={(e) =>
                      setFormData({ ...formData, value: e.target.value })
                    }
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block">
                    Expiry Date
                  </label>
                  <input
                    required
                    type="date"
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm outline-none text-gray-500"
                    value={formData.expiry}
                    onChange={(e) =>
                      setFormData({ ...formData, expiry: e.target.value })
                    }
                  />
                </div>
              </div>
              <button className="w-full bg-[#003366] text-white py-4 rounded-2xl font-black text-xs shadow-xl hover:bg-[#002244] mt-4">
                Save Discount
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal Logic - same as before */}
      {deleteId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-[#003366]/40 backdrop-blur-sm text-center">
          <div className="bg-white rounded-3xl p-8 max-w-xs w-full animate-in zoom-in">
            <AlertCircle className="text-red-500 mx-auto mb-4" size={40} />
            <h3 className="font-black text-[#003366]">Delete Discount?</h3>
            <p className="text-xs text-gray-400 my-4">
              This will remove the price reduction from your shop.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleDelete}
                className="bg-red-500 text-white py-3 rounded-xl text-xs font-bold"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setDeleteId(null)}
                className="text-gray-400 text-xs font-bold py-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
