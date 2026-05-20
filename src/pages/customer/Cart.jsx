import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Trash2,
  Minus,
  Plus,
  ChevronRight,
  ShoppingBag,
  Wrench,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../../context/useAuth";
import { useCart } from "../../context/useCart";

function merchantGroupKey(item) {
  const merchantId = Number(item.merchantId || 0);
  if (merchantId > 0) {
    return `id:${merchantId}`;
  }
  return `name:${String(item.merchant || "Merchant").toLowerCase()}`;
}

function groupProductItemsByMerchant(items) {
  const groups = new Map();
  items.forEach((item) => {
    const key = merchantGroupKey(item);
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        merchantId: Number(item.merchantId || 0),
        merchant: item.merchant || "Merchant",
        items: [],
      });
    }
    groups.get(key).items.push(item);
  });
  return Array.from(groups.values());
}

function cartSubtotal(items) {
  return items.reduce(
    (acc, item) => acc + Number(item.price || 0) * Number(item.qty || 1),
    0,
  );
}

export default function Cart() {
  const [activeTab, setActiveTab] = useState("product");
  const navigate = useNavigate();
  const { user } = useAuth();
  const { productItems, serviceItems, updateItemQty, removeFromCart } = useCart();

  const [deleteTarget, setDeleteTarget] = useState(null);

  const handleUpdateQty = (id, delta) => {
    const target = productItems.find((item) => Number(item.id) === Number(id));
    if (!target) return;
    updateItemQty("product", id, Math.max(1, Number(target.qty || 1) + delta));
  };

  const initiateRemove = (item, type) => {
    setDeleteTarget({ ...item, type });
  };

  const confirmRemove = () => {
    if (!deleteTarget) return;
    removeFromCart(deleteTarget.type, deleteTarget.id);
    setDeleteTarget(null);
  };

  const activeItems = activeTab === "product" ? productItems : serviceItems;
  const productGroups = groupProductItemsByMerchant(productItems);
  const hasMultipleProductMerchants =
    activeTab === "product" && productGroups.length > 1;
  const totalItemsCount =
    activeTab === "product"
      ? productItems.reduce((acc, item) => acc + Number(item.qty || 1), 0)
      : serviceItems.length;

  const subtotal = cartSubtotal(activeItems);
  const fee = 50.0;
  const estFee = 25.0;
  const totalAmount = subtotal + fee + estFee;

  const handleCheckout = (checkoutItems = activeItems) => {
    if (!user) {
      navigate("/login", { state: { from: { pathname: "/cart" } } });
      return;
    }

    if (checkoutItems.length === 0) {
      return;
    }

    const checkoutSubtotal = cartSubtotal(checkoutItems);
    navigate(`/checkout?type=${activeTab}`, {
      state: {
        type: activeTab,
        items: checkoutItems,
        totals: {
          subtotal: checkoutSubtotal,
          fee,
          estFee,
          totalAmount: checkoutSubtotal + fee + estFee,
        },
      },
    });
  };

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
                groups={productGroups}
                onUpdateQty={handleUpdateQty}
                onRemove={(item) => initiateRemove(item, "product")}
                onCheckoutGroup={(items) => handleCheckout(items)}
              />
            ) : (
              <ServiceCartItems
                items={serviceItems}
                onRemove={(item) => initiateRemove(item, "service")}
              />
            )}
          </div>

          <aside className="w-full lg:w-[400px] lg:sticky lg:top-24">
            <CartSummary
              type={activeTab}
              itemCount={totalItemsCount}
              subtotal={subtotal}
              fee={fee}
              estFee={estFee}
              totalAmount={totalAmount}
              onCheckout={() => handleCheckout()}
              disabled={activeItems.length === 0 || hasMultipleProductMerchants}
              note={
                hasMultipleProductMerchants
                  ? "Use a merchant checkout button from the product list."
                  : ""
              }
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

function ProductCartItems({
  items,
  groups,
  onUpdateQty,
  onRemove,
  onCheckoutGroup,
}) {
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
      {groups.map((group) => (
        <div
          key={group.key}
          className="bg-white rounded-sm shadow-sm border border-gray-100 overflow-hidden"
        >
          <div className="bg-gray-50/50 px-6 py-3 border-b border-gray-100 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="font-bold text-[#003366] text-[10px] tracking-widest">
              {group.merchant}
            </h3>
            <button
              type="button"
              onClick={() => onCheckoutGroup(group.items)}
              className="self-start sm:self-auto rounded-sm bg-[#FF851B] px-4 py-2 text-[10px] font-bold tracking-widest text-white hover:bg-[#E67616]"
            >
              Checkout This Merchant
            </button>
          </div>
          {group.items.map((item) => (
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
                    <h4 className="cart-item-name font-bold text-gray-800 text-xs tracking-tight">
                      {item.name}
                    </h4>
                    <p className="text-[9px] text-gray-400 font-semibold">
                      Category: {item.category || "General"}
                    </p>
                  </div>
                  <span className="font-bold text-[#FF851B] text-base">
                    PHP{" "}
                    {(Number(item.price || 0) * Number(item.qty || 1)).toFixed(1)}
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
      ))}
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
            <h3 className="font-bold text-[#003366] text-[10px] tracking-widest">
              {item.merchant || "Merchant"}
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
                      {item.rateType || "Per project"}
                    </p>
                  </div>
                  <span className="font-bold text-[#FF851B] text-base">
                    PHP {Number(item.price || 0).toFixed(1)}
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
                      placeholder={`Enter ${field.toLowerCase()} details`}
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
  totalAmount,
  onCheckout,
  disabled,
  note,
}) {
  return (
    <div className="bg-white rounded-sm shadow-sm border border-gray-100 p-8 flex flex-col">
      <h2 className="text-[11px] font-bold text-[#003366] tracking-[0.2em] mb-8 border-b border-gray-50 pb-4">
        Order Summary
      </h2>

      <div className="space-y-4 mb-8">
        <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 tracking-widest">
          <span>Subtotal ({itemCount} items)</span>
          <span className="text-gray-700">
            PHP{" "}
            {subtotal.toLocaleString(undefined, {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            })}
          </span>
        </div>
        <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 tracking-widest">
          <span>{type === "product" ? "Shipping fee" : "Platform fee"}</span>
          <span className="text-gray-700">PHP {fee.toFixed(1)}</span>
        </div>
        <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 tracking-widest">
          <span>Estimated fee</span>
          <span className="text-gray-700">PHP {estFee.toFixed(1)}</span>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-6 mb-8 flex flex-col items-end">
        <div className="flex justify-between items-center w-full">
          <span className="text-[10px] font-bold text-[#003366] tracking-wider">
            Total Amount
          </span>
          <span className="text-3xl font-bold text-[#FF851B] tracking-tighter">
            PHP{" "}
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
      {note ? (
        <p className="mb-4 text-center text-[10px] font-semibold text-gray-400">
          {note}
        </p>
      ) : null}

      <Link
        to="/"
        className="text-center text-[9px] font-bold text-gray-400 tracking-[0.3em] hover:text-[#003366] block italic"
      >
        Continue Shopping
      </Link>
    </div>
  );
}
