import React, { useEffect, useCallback, useState } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Tag,
  X,
  AlertCircle,
  ShoppingBag,
  Info,
  TicketPercent,
} from "lucide-react";

const paymentScope = "Checkout currently supports GCash and Cash on Delivery only.";

export default function MerchantDiscounts() {
  const [activeTab, setActiveTab] = useState("vouchers");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [formError, setFormError] = useState("");
  const [formNotice, setFormNotice] = useState("");
  const [loadError, setLoadError] = useState("");

  const [vouchers, setVouchers] = useState([]);
  const [productDiscounts, setProductDiscounts] = useState([]);

  const [formData, setFormData] = useState({
    code: "",
    productName: "",
    offeringId: "",
    originalPrice: "",
    discountType: "percentage",
    discountValue: "",
    cap: "",
    minSpend: "",
    usageLimit: "",
    startDate: "",
    endDate: "",
    expiryDate: "",
  });

  const currentItems = activeTab === "vouchers" ? vouchers : productDiscounts;

  const loadDiscounts = useCallback(async () => {
    try {
      const response = await fetch("/api/merchant_discounts.php", {
        credentials: "include",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Unable to load discounts.");
      }
      setVouchers(Array.isArray(payload.vouchers) ? payload.vouchers : []);
      setProductDiscounts(
        Array.isArray(payload.productDiscounts) ? payload.productDiscounts : [],
      );
      setLoadError("");
    } catch (error) {
      setLoadError(error.message);
    }
  }, []);

  useEffect(() => {
    loadDiscounts();
  }, [loadDiscounts]);

  const openModal = (item = null) => {
    setFormError("");
    setFormNotice("");
    setEditingItem(item);
    setFormData(
      item
        ? {
            code: item.code || "",
            productName: item.productName || "",
            offeringId: item.offeringId || "",
            originalPrice: item.originalPrice || "",
            discountType: item.discountType || "percentage",
            discountValue: item.discountValue || "",
            cap: item.cap || "",
            minSpend: item.minSpend || "",
            usageLimit: item.usageLimit || "",
            startDate: item.startDate || "",
            endDate: item.endDate || "",
            expiryDate: item.expiryDate || "",
          }
        : {
            code: "",
            productName: "",
            offeringId: "",
            originalPrice: "",
            discountType: "percentage",
            discountValue: "",
            cap: "",
            minSpend: "",
            usageLimit: "",
            startDate: "",
            endDate: "",
            expiryDate: "",
          },
    );
    setIsModalOpen(true);
  };

  const calculateDiscountedPrice = () => {
    const original = Number(formData.originalPrice || 0);
    const value = Number(formData.discountValue || 0);
    if (formData.discountType === "percentage") {
      return Math.max(0, original - original * (value / 100));
    }
    return Math.max(0, original - value);
  };

  const validateLocal = () => {
    const value = Number(formData.discountValue);
    if (!Number.isFinite(value) || value <= 0) {
      return "Discount value must be greater than zero.";
    }
    if (formData.discountType === "percentage" && value > 100) {
      return "Percentage discounts cannot exceed 100%.";
    }
    if (activeTab === "vouchers") {
      if (!/^[A-Z0-9][A-Z0-9-]{2,31}$/i.test(formData.code.trim())) {
        return "Voucher code must be 3-32 letters, numbers, or dashes.";
      }
      if (Number(formData.minSpend) < 0 || Number(formData.usageLimit) <= 0) {
        return "Minimum spend must be zero or higher and usage limit must be at least 1.";
      }
      if (!formData.expiryDate) {
        return "Expiry date is required.";
      }
    } else {
      if (!formData.productName.trim()) {
        return "Product name is required.";
      }
      if (Number(formData.originalPrice) <= 0) {
        return "Original price must be greater than zero.";
      }
      if (!formData.startDate || !formData.endDate) {
        return "Start and end dates are required.";
      }
      if (formData.endDate < formData.startDate) {
        return "End date cannot be earlier than start date.";
      }
    }
    return "";
  };

  const saveToApi = async () => {
    const body =
      activeTab === "vouchers"
        ? {
            mode: "voucher",
            code: formData.code,
            discountType: formData.discountType,
            discountValue: Number(formData.discountValue),
            cap: formData.cap,
            minSpend: Number(formData.minSpend),
            usageLimit: Number(formData.usageLimit),
            expiryDate: formData.expiryDate,
          }
        : {
            mode: "product-discount",
            offeringId: Number(formData.offeringId),
            discountType: formData.discountType,
            discountValue: Number(formData.discountValue),
            startDate: formData.startDate,
            endDate: formData.endDate,
          };

    const response = await fetch("/api/merchant_discounts.php", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "Unable to save discount.");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const validationError = validateLocal();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setFormError("");
    setFormNotice("");

    try {
      await saveToApi();
      setFormNotice("Saved to database.");
      await loadDiscounts();
      setIsModalOpen(false);
      return;
    } catch (error) {
      setFormError(error.message);
      return;
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch("/api/merchant_discounts.php", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode:
            activeTab === "vouchers"
              ? "delete-voucher"
              : "delete-product-discount",
          id: deleteId,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Unable to delete discount.");
      }
      await loadDiscounts();
      setLoadError("");
    } catch (error) {
      setLoadError(error.message);
    }
    setDeleteId(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#003366]">
            Discounts & Vouchers
          </h2>
          <p className="mt-2 text-xs font-semibold text-gray-500">
            Voucher codes validate minimum spend, usage limits, and expiry.
            Product discounts validate dates, type, value, and merchant-owned
            products when an offering ID is provided.
          </p>
          <p className="mt-1 text-[10px] font-bold text-[#FF851B]">
            {paymentScope}
          </p>
          <div className="flex gap-4 mt-4">
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InfoCard
          icon={<TicketPercent size={18} />}
          title="Voucher Validation"
          text="Code format, expiry date, cap, minimum spend, and usage limit are checked before saving."
        />
        <InfoCard
          icon={<ShoppingBag size={18} />}
          title="Product Ownership"
          text="Database-backed product discounts require a merchant-owned product offering ID."
        />
        <InfoCard
          icon={<Tag size={18} />}
          title="Checkout Scope"
          text="Discounts are compatible with the current GCash and COD checkout flow."
        />
      </div>

      {loadError && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-xs font-bold text-red-600">
          {loadError}
        </div>
      )}

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[#F9FAFB] border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
            <tr>
              <th className="px-6 py-4">
                {activeTab === "vouchers" ? "Voucher Code" : "Product Name"}
              </th>
              <th className="px-6 py-4">Discount</th>
              <th className="px-6 py-4">
                {activeTab === "vouchers" ? "Limits" : "Price"}
              </th>
              <th className="px-6 py-4">Dates</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {currentItems.map((item) => (
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
                          ? `Min spend: PHP ${item.minSpend}`
            : item.offeringId
              ? `Offering ID: ${item.offeringId}`
              : "No database offering ID"}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5 text-sm font-bold text-gray-700">
                  {item.discountType === "percentage"
                    ? `${item.discountValue}%`
                    : `PHP ${item.discountValue}`}
                </td>
                <td className="px-6 py-5">
                  {activeTab === "vouchers" ? (
                    <div className="text-[10px] text-gray-400 font-bold space-y-1">
                      <p>
                        Used {item.used} / {item.usageLimit}
                      </p>
                      <p>Cap: {item.cap ? `PHP ${item.cap}` : "No cap"}</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-black text-green-600">
                        PHP {item.discountedPrice.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        Original: PHP {item.originalPrice.toLocaleString()}
                      </p>
                    </div>
                  )}
                </td>
                <td className="px-6 py-5 font-bold text-[10px] text-gray-400">
                  {activeTab === "vouchers"
                    ? `Until ${item.expiryDate}`
                    : `${item.startDate} to ${item.endDate}`}
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
            ))}
            {currentItems.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-10 text-center text-xs font-bold text-gray-400"
                >
                  No database-backed{" "}
                  {activeTab === "vouchers" ? "vouchers" : "product discounts"}{" "}
                  found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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
              {activeTab === "vouchers" ? (
                <>
                  <Field
                    label="Voucher Code"
                    value={formData.code}
                    onChange={(value) =>
                      setFormData({ ...formData, code: value.toUpperCase() })
                    }
                    required
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <SelectField
                      label="Discount Type"
                      value={formData.discountType}
                      onChange={(value) =>
                        setFormData({ ...formData, discountType: value })
                      }
                      options={[
                        ["percentage", "Percentage"],
                        ["fixed", "Fixed Amount"],
                      ]}
                    />
                    <Field
                      label="Discount Value"
                      type="number"
                      value={formData.discountValue}
                      onChange={(value) =>
                        setFormData({ ...formData, discountValue: value })
                      }
                      required
                    />
                    <Field
                      label="Minimum Spend"
                      type="number"
                      value={formData.minSpend}
                      onChange={(value) =>
                        setFormData({ ...formData, minSpend: value })
                      }
                      required
                    />
                    <Field
                      label="Discount Cap"
                      type="number"
                      value={formData.cap}
                      onChange={(value) =>
                        setFormData({ ...formData, cap: value })
                      }
                    />
                    <Field
                      label="Usage Limit"
                      type="number"
                      value={formData.usageLimit}
                      onChange={(value) =>
                        setFormData({ ...formData, usageLimit: value })
                      }
                      required
                    />
                    <Field
                      label="Expiry Date"
                      type="date"
                      value={formData.expiryDate}
                      onChange={(value) =>
                        setFormData({ ...formData, expiryDate: value })
                      }
                      required
                    />
                  </div>
                </>
              ) : (
                <>
                  <Field
                    label="Product Name"
                    value={formData.productName}
                    onChange={(value) =>
                      setFormData({ ...formData, productName: value })
                    }
                    required
                  />
                  <Field
                    label="Database Offering ID"
                    value={formData.offeringId}
                    onChange={(value) =>
                      setFormData({ ...formData, offeringId: value })
                    }
                    placeholder="Enter offering ID from your catalog"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Field
                      label="Original Price"
                      type="number"
                      value={formData.originalPrice}
                      onChange={(value) =>
                        setFormData({ ...formData, originalPrice: value })
                      }
                      required
                    />
                    <SelectField
                      label="Discount Type"
                      value={formData.discountType}
                      onChange={(value) =>
                        setFormData({ ...formData, discountType: value })
                      }
                      options={[
                        ["percentage", "Percentage"],
                        ["fixed", "Fixed Amount"],
                      ]}
                    />
                    <Field
                      label="Discount Value"
                      type="number"
                      value={formData.discountValue}
                      onChange={(value) =>
                        setFormData({ ...formData, discountValue: value })
                      }
                      required
                    />
                    <div className="rounded-xl bg-green-50 border border-green-100 p-4">
                      <p className="text-[10px] font-black text-green-600 uppercase">
                        Discounted Price
                      </p>
                      <p className="mt-1 text-lg font-black text-green-700">
                        PHP {calculateDiscountedPrice().toLocaleString()}
                      </p>
                    </div>
                    <Field
                      label="Start Date"
                      type="date"
                      value={formData.startDate}
                      onChange={(value) =>
                        setFormData({ ...formData, startDate: value })
                      }
                      required
                    />
                    <Field
                      label="End Date"
                      type="date"
                      value={formData.endDate}
                      onChange={(value) =>
                        setFormData({ ...formData, endDate: value })
                      }
                      required
                    />
                  </div>
                </>
              )}

              {formError && (
                <p className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-xs font-bold text-red-600">
                  {formError}
                </p>
              )}
              {formNotice && (
                <p className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 text-xs font-bold text-[#0074D9]">
                  {formNotice}
                </p>
              )}

              <button className="w-full bg-[#003366] text-white py-4 rounded-2xl font-black text-xs shadow-xl hover:bg-[#002244] mt-4">
                Save Discount
              </button>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-[#003366]/40 backdrop-blur-sm text-center">
          <div className="bg-white rounded-3xl p-8 max-w-xs w-full animate-in zoom-in">
            <AlertCircle className="text-red-500 mx-auto mb-4" size={40} />
            <h3 className="font-black text-[#003366]">Delete Discount?</h3>
            <p className="text-xs text-gray-400 my-4">
              This removes the discount entry from your database-backed shop view.
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

function InfoCard({ icon, title, text }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-2 text-[#003366]">
        <span className="text-[#FF851B]">{icon}</span>
        <h3 className="text-xs font-black uppercase tracking-wider">{title}</h3>
      </div>
      <p className="mt-3 text-[11px] font-semibold leading-relaxed text-gray-500">
        {text}
      </p>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required, placeholder }) {
  return (
    <div>
      <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block">
        {label}
      </label>
      <input
        required={required}
        type={type}
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm outline-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block">
        {label}
      </label>
      <select
        className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm outline-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map(([optionValue, labelText]) => (
          <option key={optionValue} value={optionValue}>
            {labelText}
          </option>
        ))}
      </select>
    </div>
  );
}
