import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Trash2,
  Minus,
  Plus,
  ChevronRight,
  ShoppingBag,
  Wrench,
  Ticket,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

export default function Cart() {
  const [activeTab, setActiveTab] = useState("product");
  const navigate = useNavigate();

  // --- FR-16: Allow customers to add products and services to the shopping cart ---
  // (Note: In a full app, this initial state would come from a global CartContext)
  const [productItems, setProductItems] = useState([
    {
      id: 1,
      shop: "TechHub Electronics",
      shopInitials: "TH",
      name: "Wireless Earbuds: Noise Cancelling",
      variant: "Space Gray",
      price: 999.0,
      qty: 1,
      img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=200",
    },
    {
      id: 2,
      shop: "TechHub Electronics",
      shopInitials: "TH",
      name: "Mechanical Keyboard",
      variant: "Blue Switches",
      price: 904.3,
      qty: 1,
      img: "https://images.unsplash.com/photo-1591561954557-26941169b49e?q=80&w=200",
    },
  ]);

  const [serviceItems, setServiceItems] = useState([
    {
      id: 1,
      shop: "Creative Studio",
      shopInitials: "CS",
      name: "Professional Logo Design",
      package: "Premium Branding Package",
      price: 1903.3,
      img: "https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=200",
      fields: { deadline: "", package: "", businessType: "", brief: "" },
    },
  ]);

  const [discount, setDiscount] = useState(0);

  // State for the Delete Confirmation Modal
  const [deleteTarget, setDeleteTarget] = useState(null);

  // --- FR-17: Allow customers to update the quantity of items in the cart ---
  const handleUpdateQty = (id, delta) => {
    setProductItems((items) =>
      items.map((item) =>
        item.id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item,
      ),
    );
  };

  // --- FR-18: Allow customers to remove items from the cart ---
  const initiateRemove = (item, type) => {
    setDeleteTarget({ ...item, type });
  };

  const confirmRemove = () => {
    if (deleteTarget) {
      if (deleteTarget.type === "product") {
        setProductItems((items) =>
          items.filter((item) => item.id !== deleteTarget.id),
        );
      } else if (deleteTarget.type === "service") {
        setServiceItems((items) =>
          items.filter((item) => item.id !== deleteTarget.id),
        );
      }
      setDeleteTarget(null); // Close modal
    }
  };

  // --- FR-20: Apply discounts to the items in the cart ---
  const handleApplyVoucher = (code) => {
    if (code.toUpperCase() === "ISKO10") {
      setDiscount(0.1); // 10% discount
      alert("Voucher ISKO10 applied successfully!");
    } else {
      setDiscount(0);
      alert("Invalid voucher code.");
    }
  };

  const handleCheckout = () => {
    navigate(`/checkout?type=${activeTab}`);
  };

  // --- FR-19: Automatically compute and display the total price ---
  const activeItems = activeTab === "product" ? productItems : serviceItems;
  const totalItemsCount =
    activeTab === "product"
      ? productItems.reduce((acc, item) => acc + item.qty, 0)
      : serviceItems.length;

  const subtotal = activeItems.reduce(
    (acc, item) => acc + item.price * (item.qty || 1),
    0,
  );
  const fee = activeTab === "product" ? 50.0 : 50.0;
  const estFee = 25.0;
  const discountAmount = subtotal * discount;
  const totalAmount = subtotal + fee + estFee - discountAmount;

  return (
    <div className="bg-[#F5F7F9] min-h-screen font-sans relative">
      <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center gap-2 text-[10px] text-gray-400 font-bold tracking-widest">
        <Link to="/" className="hover:text-[#003366] transition-colors italic">
          Home
        </Link>
        <ChevronRight size={10} />
        <span className="text-[#003366] italic">Shopping Cart</span>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 pb-20">
        <div className="bg-white rounded-t-md shadow-sm flex mb-8 overflow-hidden p-1 border border-gray-100">
          <button
            onClick={() => setActiveTab("product")}
            className={`flex-1 py-3 flex items-center justify-center gap-3 transition-all rounded-sm ${
              activeTab === "product"
                ? "bg-[#003366] text-white shadow-md"
                : "text-gray-400 hover:bg-gray-50"
            }`}
          >
            <ShoppingBag size={18} />
            <span className="font-bold text-[11px] tracking-wider">
              Product Cart ({productItems.length})
            </span>
          </button>
          <button
            onClick={() => setActiveTab("service")}
            className={`flex-1 py-3 flex items-center justify-center gap-3 transition-all rounded-sm ${
              activeTab === "service"
                ? "bg-[#003366] text-white shadow-md"
                : "text-gray-400 hover:bg-gray-50"
            }`}
          >
            <Wrench size={18} />
            <span className="font-bold text-[11px] tracking-wider">
              Service Cart ({serviceItems.length})
            </span>
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start relative">
          <div className="flex-grow w-full space-y-6">
            {activeTab === "product" ? (
              <ProductCartItems
                items={productItems}
                onUpdateQty={handleUpdateQty}
                onRemove={(item) => initiateRemove(item, "product")}
              />
            ) : (
              <ServiceCartItems
                items={serviceItems}
                onRemove={(item) => initiateRemove(item, "service")}
              />
            )}
          </div>

          {/* ASIDE: Sticky summary */}
          <aside className="w-full lg:w-[400px] lg:sticky lg:top-24">
            <CartSummary
              type={activeTab}
              itemCount={totalItemsCount}
              subtotal={subtotal}
              fee={fee}
              estFee={estFee}
              discountAmount={discountAmount}
              totalAmount={totalAmount}
              onApplyVoucher={handleApplyVoucher}
              onCheckout={handleCheckout}
              disabled={activeItems.length === 0}
            />

            <div className="mt-6 bg-[#F8FAFC] p-4 rounded-md flex items-center gap-4 border border-gray-100">
              <ShieldCheck className="text-[#003366] shrink-0" size={20} />
              <p className="text-[9px] text-[#003366] font-bold leading-relaxed italic opacity-60">
                IskoMart Guarantee: Your payments are secure and held until
                order completion.
              </p>
            </div>
          </aside>
        </div>
      </div>

      {/* --- DELETE CONFIRMATION MODAL --- */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#003366]/40 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setDeleteTarget(null)}
          ></div>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm relative z-10 overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={32} className="text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-[#003366] mb-2">
                Remove Item?
              </h3>
              <p className="text-gray-500 text-xs mb-6 leading-relaxed px-2">
                Are you sure you want to remove{" "}
                <span className="font-bold text-gray-800">
                  "{deleteTarget.name}"
                </span>{" "}
                from your cart?
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={confirmRemove}
                  className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-bold text-xs shadow-md active:scale-95 transition-all"
                >
                  Yes, remove it
                </button>
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="w-full bg-white text-gray-500 py-3 rounded-xl font-bold text-xs border border-gray-100 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
            <div className="h-1.5 w-full bg-red-500"></div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- SUB-COMPONENTS ---

function ProductCartItems({ items, onUpdateQty, onRemove }) {
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-sm shadow-sm border border-gray-100 p-12 text-center text-gray-400">
        <ShoppingBag size={48} className="mx-auto mb-4 opacity-50" />
        <p className="font-bold text-sm">Your product cart is empty.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-sm shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gray-50/50 px-6 py-3 border-b border-gray-100 flex items-center gap-3">
          <div className="w-6 h-6 bg-[#003366] rounded-full flex items-center justify-center text-[8px] text-white font-bold">
            {items[0].shopInitials}
          </div>
          <h3 className="font-bold text-[#003366] text-[10px] tracking-widest">
            {items[0].shop}
          </h3>
        </div>
        {items.map((item) => (
          <div
            key={item.id}
            className="p-6 flex gap-6 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"
          >
            <div className="w-24 h-24 bg-gray-100 rounded-md overflow-hidden shrink-0 border border-gray-100">
              <img
                src={item.img}
                className="w-full h-full object-cover"
                alt="item"
              />
            </div>
            <div className="flex-grow flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="space-y-0.5">
                  <h4 className="font-bold text-gray-800 text-xs tracking-tight">
                    {item.name}
                  </h4>
                  <p className="text-[9px] text-gray-400 font-semibold">
                    Variation: {item.variant}
                  </p>
                </div>
                <span className="font-bold text-[#FF851B] text-base">
                  ₱{(item.price * item.qty).toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between items-center mt-4">
                <div className="flex items-center border border-gray-200 rounded-sm bg-white overflow-hidden shadow-sm">
                  <button
                    onClick={() => onUpdateQty(item.id, -1)}
                    className="px-3 py-1 hover:bg-gray-50 text-gray-400 border-r border-gray-100"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="px-4 font-bold text-[#003366] text-xs w-10 text-center">
                    {item.qty}
                  </span>
                  <button
                    onClick={() => onUpdateQty(item.id, 1)}
                    className="px-3 py-1 hover:bg-gray-50 text-gray-400 border-l border-gray-100"
                  >
                    <Plus size={12} />
                  </button>
                </div>
                <button
                  onClick={() => onRemove(item)}
                  className="text-gray-300 hover:text-red-500 flex items-center gap-1.5 transition-colors group"
                >
                  <Trash2 size={14} />
                  <span className="text-[9px] font-bold">Remove</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ServiceCartItems({ items, onRemove }) {
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-sm shadow-sm border border-gray-100 p-12 text-center text-gray-400">
        <Wrench size={48} className="mx-auto mb-4 opacity-50" />
        <p className="font-bold text-sm">Your service cart is empty.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div
          key={item.id}
          className="bg-white rounded-sm shadow-sm border border-gray-100 overflow-hidden"
        >
          <div className="bg-gray-50/50 px-6 py-3 border-b border-gray-100 flex items-center gap-3">
            <div className="w-6 h-6 bg-[#FF851B] rounded-full flex items-center justify-center text-[8px] text-white font-bold">
              {item.shopInitials}
            </div>
            <h3 className="font-bold text-[#003366] text-[10px] tracking-widest">
              {item.shop}
            </h3>
          </div>
          <div className="p-8 space-y-8">
            <div className="flex gap-6">
              <div className="w-24 h-24 bg-gray-100 rounded-md overflow-hidden shrink-0 border border-gray-100">
                <img
                  src={item.img}
                  className="w-full h-full object-cover"
                  alt="serv"
                />
              </div>
              <div className="flex-grow flex flex-col justify-between py-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-gray-800 text-xs tracking-tight">
                      {item.name}
                    </h4>
                    <p className="text-[9px] text-[#0074D9] font-bold mt-1">
                      {item.package}
                    </p>
                  </div>
                  <span className="font-bold text-[#FF851B] text-base">
                    ₱{item.price.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#F8FAFC] p-6 rounded-md border border-gray-100">
              {["Deadline", "Package", "Business Type", "Brief"].map(
                (field) => (
                  <div key={field} className="flex flex-col gap-1.5">
                    <label className="text-[8px] font-bold text-gray-400 tracking-widest">
                      {field}
                    </label>
                    <input
                      type="text"
                      placeholder="..."
                      className="bg-white border border-gray-200 rounded-sm px-3 py-2 text-[11px] focus:outline-none focus:border-[#003366]"
                    />
                  </div>
                ),
              )}
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => onRemove(item)}
                className="text-gray-300 hover:text-red-500 flex items-center gap-1.5 transition-colors group"
              >
                <Trash2 size={14} />
                <span className="text-[9px] font-bold">Remove</span>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CartSummary({
  type,
  itemCount,
  subtotal,
  fee,
  estFee,
  discountAmount,
  totalAmount,
  onApplyVoucher,
  onCheckout,
  disabled,
}) {
  const [voucherInput, setVoucherInput] = useState("");

  return (
    <div className="bg-white rounded-sm shadow-sm border border-gray-100 p-8 flex flex-col">
      <h2 className="text-[11px] font-bold text-[#003366] tracking-[0.2em] mb-8 border-b border-gray-50 pb-4">
        Order Summary
      </h2>

      <div className="space-y-4 mb-8">
        <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 tracking-widest">
          <span>Subtotal ({itemCount} items)</span>
          <span className="text-gray-700">
            ₱
            {subtotal.toLocaleString(undefined, {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            })}
          </span>
        </div>
        <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 tracking-widest">
          <span>{type === "product" ? "Shipping fee" : "Platform fee"}</span>
          <span className="text-gray-700">₱{fee.toFixed(1)}</span>
        </div>
        <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 tracking-widest">
          <span>Estimated fee</span>
          <span className="text-gray-700">₱{estFee.toFixed(1)}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between items-center text-[10px] font-bold text-green-500 tracking-widest">
            <span>Discount Applied</span>
            <span>- ₱{discountAmount.toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* Voucher Box */}
      <div className="mb-10 bg-[#F8FAFC] p-5 rounded-md border border-gray-200/50">
        <label className="text-[8px] font-bold text-gray-400 tracking-widest block mb-2">
          Voucher Code
        </label>
        <div className="flex gap-2">
          <div className="relative flex-grow">
            <Ticket
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300"
            />
            <input
              type="text"
              value={voucherInput}
              onChange={(e) => setVoucherInput(e.target.value)}
              placeholder="Try ISKO10"
              className="w-full pl-9 pr-2 py-2.5 border border-gray-200 rounded-sm text-[11px] focus:outline-none"
            />
          </div>
          <button
            onClick={() => onApplyVoucher(voucherInput)}
            className="bg-[#003366] text-white px-5 py-2.5 rounded-sm text-[10px] font-bold hover:bg-[#002244] transition-colors"
          >
            Apply
          </button>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-6 mb-8 flex flex-col items-end">
        <div className="flex justify-between items-center w-full">
          <span className="text-[10px] font-bold text-[#003366] tracking-wider">
            Total Amount
          </span>
          <span className="text-3xl font-bold text-[#FF851B] tracking-tighter">
            ₱
            {totalAmount > 0
              ? totalAmount.toLocaleString(undefined, {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                })
              : "0.0"}
          </span>
        </div>
        <span className="text-[8px] text-gray-300 font-bold mt-1">
          VAT Included
        </span>
      </div>

      <button
        onClick={onCheckout}
        disabled={disabled}
        className={`w-full py-3.5 rounded-md font-bold text-[11px] tracking-widest transition-all shadow-lg active:scale-95 mb-4 ${
          disabled
            ? "bg-gray-300 text-gray-100 cursor-not-allowed shadow-none"
            : "bg-[#FF851B] text-white hover:bg-[#E67616]"
        }`}
      >
        {type === "product" ? "Proceed to Checkout" : "Place Order Now"}
      </button>

      <Link
        to="/"
        className="text-center text-[9px] font-bold text-gray-400 tracking-[0.3em] hover:text-[#003366] block italic"
      >
        Continue Shopping
      </Link>
    </div>
  );
}
