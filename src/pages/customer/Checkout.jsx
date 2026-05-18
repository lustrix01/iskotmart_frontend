import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  Link,
  useLocation,
  useSearchParams,
  useNavigate,
} from "react-router-dom";
import {
  MapPin,
  Truck,
  Store,
  Wallet,
  Smartphone,
  Ticket,
  ChevronRight,
  Info,
  Calendar,
  Clock,
  CheckCircle2,
  ShoppingBag,
  ArrowRight,
  MessageSquare,
  ShieldCheck,
  X,
  Handshake,
  Save,
  Receipt,
  // Added icons specifically for the GCash modal update
  QrCode,
  Upload,
} from "lucide-react";
import { useAuth } from "../../context/useAuth";
import { useCart } from "../../context/useCart";

const defaultServiceDeadline = () => {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().slice(0, 10);
};

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { productItems, serviceItems, removeFromCart } = useCart();
  const type = searchParams.get("type") || "product";
  const checkoutState = location.state || {};
  const cartCheckoutItems = type === "product" ? productItems : serviceItems;
  const checkoutItems =
    Array.isArray(checkoutState.items) && checkoutState.items.length > 0
      ? checkoutState.items
      : cartCheckoutItems;
  const hasCheckoutItems = checkoutItems.length > 0;

  // --- FR-28 & FR-29: Choose payment options, including COD ---
  const [deliveryMethod, setDeliveryMethod] = useState("standard");
  const [paymentMethod, setPaymentMethod] = useState("cod");

  const [showSuccess, setShowSuccess] = useState(false);
  const [showGCashModal, setShowGCashModal] = useState(false);
  const [isProcessingGCash, setIsProcessingGCash] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [voucherInput, setVoucherInput] = useState("");
  const [appliedVouchers, setAppliedVouchers] = useState([]);
  const [voucherMessage, setVoucherMessage] = useState("");
  const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);
  const [paymentOptions, setPaymentOptions] = useState({
    allowedMethods: { cod: true, gcash: true },
    deliveryOptions: { standard: true, pickup: true, deliveryFee: 50 },
    merchants: [],
    loaded: false,
    error: "",
  });

  const [orderNumber, setOrderNumber] = useState("");

  // --- FR-31: Mark orders as paid or unpaid ---
  const [paymentStatus, setPaymentStatus] = useState("Unpaid");

  // FR-21: Collect customer shipping and contact information
  const [isEditing, setIsEditing] = useState(false);
  const [addressData, setAddressData] = useState({
    name: "",
    phone: "",
    label: "",
    address: "",
  });
  const [isLoadingAddress, setIsLoadingAddress] = useState(type === "product");
  const [addressError, setAddressError] = useState("");

  const [serviceData, setServiceData] = useState({
    deadline: defaultServiceDeadline(),
    complexity: "Premium Branding",
  });

  // --- ADDED STATES FOR NEW GCASH LOGIC ---
  const [referenceNumber, setReferenceNumber] = useState("");
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const fileInputRef = useRef(null);

  const subtotal = checkoutItems.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.qty || 1),
    0,
  );
  const shippingFee =
    hasCheckoutItems && deliveryMethod === "standard" && type === "product"
      ? Number(paymentOptions.deliveryOptions?.deliveryFee ?? 50)
      : 0.0;
  const serviceFee = hasCheckoutItems && type === "service" ? 50.0 : 0.0;
  const discountAmount = appliedVouchers.reduce(
    (sum, voucher) => sum + Number(voucher.discountAmount || 0),
    0,
  );
  const total = Math.max(0, subtotal + shippingFee + serviceFee - discountAmount);
  const hasShippingAddress =
    type !== "product" ||
    Boolean(addressData.name && addressData.phone && addressData.address);
  const optionItemsKey = useMemo(
    () =>
      checkoutItems
        .map((item) => `${Number(item.id)}:${Number(item.qty || 1)}`)
        .join("|"),
    [checkoutItems],
  );
  const isPaymentAllowed = (method) =>
    !paymentOptions.loaded || Boolean(paymentOptions.allowedMethods?.[method]);
  const isDeliveryAllowed = (method) =>
    type !== "product" ||
    !paymentOptions.loaded ||
    Boolean(paymentOptions.deliveryOptions?.[method]);
  const gcashPaymentDetails = paymentOptions.merchants
    .map((merchant) => ({
      ...merchant,
      methods: (merchant.methods || []).filter((method) => method.kind === "gcash"),
    }))
    .filter((merchant) => merchant.methods.length > 0);

  useEffect(() => {
    if (!user || type !== "product") {
      setIsLoadingAddress(false);
      return;
    }

    let isMounted = true;

    const loadDefaultAddress = async () => {
      setIsLoadingAddress(true);
      setAddressError("");

      try {
        const response = await fetch("/api/addresses.php", {
          method: "GET",
          credentials: "include",
        });
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(payload.error || "Unable to load saved addresses.");
        }

        const addresses = Array.isArray(payload.addresses)
          ? payload.addresses
          : [];
        const selectedAddress =
          addresses.find((address) => address.isDefault) || addresses[0];

        if (!isMounted) {
          return;
        }

        if (selectedAddress) {
          setAddressData({
            name: selectedAddress.recipientName || "",
            phone: selectedAddress.phone || "",
            label: selectedAddress.category || "Address",
            address: formatAddressLine(selectedAddress),
          });
        } else {
          setAddressData({ name: "", phone: "", label: "", address: "" });
        }
      } catch (error) {
        if (isMounted) {
          setAddressError(error.message);
        }
      } finally {
        if (isMounted) {
          setIsLoadingAddress(false);
        }
      }
    };

    loadDefaultAddress();

    return () => {
      isMounted = false;
    };
  }, [type, user]);

  useEffect(() => {
    if (!user || !hasCheckoutItems) {
      setPaymentOptions({
        allowedMethods: { cod: true, gcash: true },
        deliveryOptions: { standard: true, pickup: true, deliveryFee: 50 },
        merchants: [],
        loaded: false,
        error: "",
      });
      return;
    }

    let isMounted = true;

    const loadPaymentOptions = async () => {
      try {
        const response = await fetch("/api/checkout_payment_options.php", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type,
            items: checkoutItems.map((item) => ({
              id: Number(item.id),
              quantity: Number(item.qty || 1),
            })),
          }),
        });
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(payload.error || "Unable to load payment options.");
        }

        if (!isMounted) {
          return;
        }

        const nextOptions = {
          allowedMethods: {
            cod: Boolean(payload.allowedMethods?.cod),
            gcash: Boolean(payload.allowedMethods?.gcash),
          },
          deliveryOptions: {
            standard: Boolean(payload.deliveryOptions?.standard),
            pickup: Boolean(payload.deliveryOptions?.pickup),
            deliveryFee: Number(payload.deliveryOptions?.deliveryFee ?? 50),
          },
          merchants: Array.isArray(payload.merchants) ? payload.merchants : [],
          loaded: true,
          error: "",
        };
        setPaymentOptions(nextOptions);

        if (!nextOptions.allowedMethods[paymentMethod]) {
          setPaymentMethod(nextOptions.allowedMethods.cod ? "cod" : "gcash");
        }
        if (type === "product" && !nextOptions.deliveryOptions[deliveryMethod]) {
          setDeliveryMethod(nextOptions.deliveryOptions.standard ? "standard" : "pickup");
        }
      } catch (error) {
        if (isMounted) {
          setPaymentOptions({
            allowedMethods: { cod: false, gcash: false },
            deliveryOptions: { standard: false, pickup: false, deliveryFee: 50 },
            merchants: [],
            loaded: true,
            error: error.message,
          });
        }
      }
    };

    loadPaymentOptions();

    return () => {
      isMounted = false;
    };
  }, [type, user, hasCheckoutItems, checkoutItems, optionItemsKey, paymentMethod, deliveryMethod]);

  const submitOrder = async ({ gcashReference = "" } = {}) => {
    if (!user) {
      navigate("/login", { state: { from: location } });
      return false;
    }

    if (!hasCheckoutItems) {
      setCheckoutError("Your checkout is empty. Add an item to your cart first.");
      return false;
    }

    if (!hasShippingAddress) {
      setCheckoutError("Add a shipping address before placing this order.");
      return false;
    }

    setCheckoutError("");
    setIsSubmittingOrder(true);

    try {
      const response = await fetch("/api/checkout.php", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          paymentMethod,
          deliveryMethod,
          referenceNumber: gcashReference,
          paymentProofImage:
            paymentMethod === "gcash" ? paymentScreenshot || "" : "",
          voucherCodes: appliedVouchers.map((voucher) => voucher.code),
          customer: {
            recipientName: addressData.name,
            phone: addressData.phone,
            address: addressData.address,
          },
          service: serviceData,
          items: checkoutItems.map((item) => ({
            id: Number(item.id),
            name: item.name,
            quantity: Number(item.qty || 1),
          })),
          totals: {
            subtotal,
            shippingFee,
            serviceFee,
            discountAmount,
            total,
          },
        }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || "Unable to place order.");
      }

      setOrderNumber(payload.orderNumber);
      setPaymentStatus(payload.paymentStatus);
      checkoutItems.forEach((item) => {
        removeFromCart(type, item.id);
      });
      setShowSuccess(true);
      return true;
    } catch (error) {
      setCheckoutError(error.message);
      return false;
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // --- FR-30: Record selected payment methods ---
  const handlePlaceOrder = () => {
    if (!hasShippingAddress) {
      setCheckoutError("Add a shipping address before placing this order.");
      return;
    }

    if (!isDeliveryAllowed(deliveryMethod)) {
      setCheckoutError(
        deliveryMethod === "standard"
          ? "Standard delivery is not enabled by this merchant."
          : "Campus meetup is not enabled by this merchant.",
      );
      return;
    }

    if (paymentMethod === "gcash") {
      if (!isPaymentAllowed("gcash") || gcashPaymentDetails.length === 0) {
        setCheckoutError("GCash is not configured for this merchant.");
        return;
      }
      setShowGCashModal(true);
    } else {
      if (!isPaymentAllowed("cod")) {
        setCheckoutError("COD is not configured for this merchant.");
        return;
      }
      submitOrder();
    }
  };

  const handleApplyVoucher = async () => {
    const code = voucherInput.trim().toUpperCase();

    if (!code) {
      setVoucherMessage("");
      return;
    }

    if (appliedVouchers.some((voucher) => voucher.code === code)) {
      setVoucherMessage(`Voucher ${code} is already applied.`);
      return;
    }

    setIsApplyingVoucher(true);
    setVoucherMessage("");

    try {
      const response = await fetch("/api/customer_voucher.php", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          code,
          appliedCodes: appliedVouchers.map((voucher) => voucher.code),
          items: checkoutItems.map((item) => ({
            id: Number(item.id),
            quantity: Number(item.qty || 1),
          })),
        }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || "Invalid voucher code.");
      }

      const merchantId = Number(payload.merchantId || 0);
      const eligibleSubtotal = Number(payload.eligibleSubtotal || 0);
      const existingMerchantDiscount = appliedVouchers
        .filter((voucher) => Number(voucher.merchantId || 0) === merchantId)
        .reduce((sum, voucher) => sum + Number(voucher.discountAmount || 0), 0);
      const discountAmount = Math.min(
        Number(payload.discountAmount || 0),
        Math.max(0, eligibleSubtotal - existingMerchantDiscount),
      );

      if (discountAmount <= 0) {
        throw new Error("Voucher discount exceeds the eligible store subtotal.");
      }

      const nextVoucher = {
        code: payload.code || code,
        discountAmount,
        eligibleSubtotal,
        merchantId,
      };
      setAppliedVouchers((current) => [...current, nextVoucher]);
      setVoucherInput("");
      setVoucherMessage(payload.message || `Voucher ${code} applied.`);
    } catch (error) {
      setVoucherMessage(error.message);
    } finally {
      setIsApplyingVoucher(false);
    }
  };

  const handleRemoveVoucher = (code) => {
    setAppliedVouchers((current) =>
      current.filter((voucher) => voucher.code !== code),
    );
    setVoucherMessage("");
  };

  const handleGCashSubmit = (e) => {
    if (e) e.preventDefault();
    if (!referenceNumber) {
      alert("Please enter the 13-digit Reference Number.");
      return;
    }
    if (!paymentScreenshot) {
      alert("Please upload the GCash payment proof image.");
      return;
    }

    setIsProcessingGCash(true);
    submitOrder({ gcashReference: referenceNumber })
      .then((placed) => {
        if (placed) {
          setShowGCashModal(false);
        }
      })
      .finally(() => {
        setIsProcessingGCash(false);
      });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setPaymentScreenshot(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPaymentScreenshot(String(reader.result || ""));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="bg-[#F5F7F9] min-h-screen pb-20 font-sans relative">
      {/* BREADCRUMBS */}
      <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center gap-2 text-[11px] text-gray-400 font-bold tracking-wider">
        <Link to="/" className="hover:text-[#003366] transition-colors italic">
          Home
        </Link>
        <ChevronRight size={10} />
        <Link
          to="/cart"
          className="hover:text-[#003366] transition-colors italic"
        >
          Cart
        </Link>
        <ChevronRight size={10} />
        <span className="text-[#003366] italic">
          Checkout: {type === "product" ? "Product" : "Service"}
        </span>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 flex flex-col lg:flex-row gap-8 items-start">
        {/* LEFT SIDE: DETAILS */}
        <div className="flex-grow w-full space-y-6">
          {/* Address / Requirements Collection */}
          <div className="bg-white rounded-sm shadow-sm border border-gray-100 overflow-hidden transition-all">
            <div className="bg-gray-50/50 px-6 py-3 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-[#003366] text-[12px] tracking-wide">
                {type === "product"
                  ? "Shipping address"
                  : "Service requirements"}
              </h3>
              <button
                onClick={() =>
                  type === "product"
                    ? navigate("/profile/addresses", { state: { from: location } })
                    : setIsEditing(!isEditing)
                }
                className="text-[10px] text-[#FF851B] font-bold hover:underline flex items-center gap-1"
              >
                {type === "product" ? (
                  addressData.address ? "Manage" : "Add address"
                ) : isEditing ? (
                  <>
                    <Save size={12} /> Save
                  </>
                ) : (
                  "Edit"
                )}
              </button>
            </div>

            <div className="p-6">
              {type === "product" ? (
                isLoadingAddress ? (
                  <div className="rounded-md border border-gray-100 bg-gray-50 px-4 py-5 text-xs font-bold text-gray-400">
                    Loading saved address...
                  </div>
                ) : addressData.address ? (
                  <div className="space-y-1 animate-in fade-in">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-bold text-gray-800 text-sm">
                        {addressData.name}
                      </span>
                      <span className="text-gray-400 font-bold text-xs border-l pl-3">
                        {addressData.phone}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="bg-[#FF851B] text-white text-[9px] font-bold px-2 py-0.5 rounded-sm mt-1 uppercase tracking-wider">
                        {addressData.label}
                      </span>
                      <p className="text-gray-500 text-xs leading-relaxed">
                        {addressData.address}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-md border border-orange-100 bg-orange-50 px-5 py-5">
                    <div className="flex items-start gap-3">
                      <MapPin className="text-[#FF851B] shrink-0 mt-0.5" size={18} />
                      <div className="flex-grow">
                        <p className="text-xs font-bold text-[#003366]">
                          Add a shipping address to continue.
                        </p>
                        <p className="mt-1 text-[10px] font-semibold text-gray-500 leading-relaxed">
                          Checkout uses your saved address book. Add one in your
                          profile, then return to place this order.
                        </p>
                        {addressError && (
                          <p className="mt-2 text-[10px] font-bold text-red-500">
                            {addressError}
                          </p>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            navigate("/profile/addresses", {
                              state: { from: location },
                            })
                          }
                          className="mt-4 rounded-md bg-[#003366] px-4 py-2 text-[10px] font-bold text-white hover:bg-[#002244]"
                        >
                          Add address
                        </button>
                      </div>
                    </div>
                  </div>
                )
              ) : isEditing ? (
                <div className="grid grid-cols-2 gap-6 animate-in fade-in">
                  <div className="space-y-1">
                    <label className="text-[9px] text-gray-400 font-bold">
                      Target deadline
                    </label>
                    <input
                      type="date"
                      value={serviceData.deadline}
                      onChange={(e) =>
                        setServiceData({
                          ...serviceData,
                          deadline: e.target.value,
                        })
                      }
                      className="w-full border border-gray-200 rounded-sm px-3 py-2 text-xs focus:outline-none focus:border-[#FF851B]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-gray-400 font-bold">
                      Complexity
                    </label>
                    <select
                      value={serviceData.complexity}
                      onChange={(e) =>
                        setServiceData({
                          ...serviceData,
                          complexity: e.target.value,
                        })
                      }
                      className="w-full border border-gray-200 rounded-sm px-3 py-2 text-xs focus:outline-none focus:border-[#FF851B]"
                    >
                      <option>Basic Design</option>
                      <option>Premium Branding</option>
                      <option>Full Agency Setup</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-6 animate-in fade-in">
                  <div className="flex items-center gap-3">
                    <Calendar className="text-[#0074D9]" size={18} />
                    <div>
                      <p className="text-[9px] text-gray-400 font-bold">
                        Target deadline
                      </p>
                      <p className="text-xs font-bold text-gray-700">
                        {serviceData.deadline}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="text-[#0074D9]" size={18} />
                    <div>
                      <p className="text-[9px] text-gray-400 font-bold">
                        Complexity
                      </p>
                      <p className="text-xs font-bold text-gray-700">
                        {serviceData.complexity}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Delivery Methods */}
          <div className="bg-white rounded-sm shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50/50 px-6 py-3 border-b border-gray-100">
              <h3 className="font-bold text-[#003366] text-[12px] tracking-wide">
                {type === "product" ? "Delivery method" : "Service mode"}
              </h3>
            </div>
            <div className="p-6 space-y-3">
              <MethodCard
                id="standard"
                selected={deliveryMethod === "standard"}
                onClick={setDeliveryMethod}
                disabled={!isDeliveryAllowed("standard")}
                icon={<Truck size={20} />}
                title={
                  type === "product" ? "Standard delivery" : "Online / Remote"
                }
                desc={
                  type === "product"
                    ? "3-5 business days via campus rider"
                    : "Via Email/Cloud Link"
                }
                price={
                  type === "product"
                    ? `₱${Number(paymentOptions.deliveryOptions?.deliveryFee ?? 50).toFixed(1)}`
                    : "₱0.0"
                }
              />

              <MethodCard
                id="pickup"
                selected={deliveryMethod === "pickup"}
                onClick={setDeliveryMethod}
                disabled={!isDeliveryAllowed("pickup")}
                icon={<Handshake size={20} />}
                title={
                  type === "product" ? "Campus Meetup" : "On-campus meeting"
                }
                desc={
                  type === "product"
                    ? "Direct hand-over on BU Campus"
                    : "BU Main Campus Student Lounge"
                }
                price="₱0.0"
              />

              {deliveryMethod === "pickup" && (
                <div className="mt-4 p-4 bg-blue-50/50 border border-blue-100 rounded-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-1">
                  <MessageSquare
                    className="text-[#0074D9] shrink-0"
                    size={16}
                  />
                  <div>
                    <p className="text-[11px] font-bold text-[#003366]">
                      IskoChat Coordination Required
                    </p>
                    <p className="text-[10px] text-gray-500 leading-relaxed mt-0.5">
                      You have selected <b>Meetup</b>. Please coordinate with
                      the student merchant through IskoChat to agree on the
                      specific college, building, or landmark for the hand-over.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* FR-28 & FR-29: Payment Methods */}
          <div className="bg-white rounded-sm shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50/50 px-6 py-3 border-b border-gray-100">
              <h3 className="font-bold text-[#003366] text-[12px] tracking-wide">
                Payment method
              </h3>
            </div>
            <div className="p-6 space-y-3">
              <MethodCard
                id="cod"
                selected={paymentMethod === "cod"}
                onClick={setPaymentMethod}
                disabled={!isPaymentAllowed("cod")}
                icon={<Wallet size={20} />}
                title={
                  type === "product"
                    ? "Cash on Delivery / Hand-over"
                    : "Pay on meetup"
                }
                desc={
                  isPaymentAllowed("cod")
                    ? "Pay directly in cash during the transaction"
                    : "Not enabled by this merchant"
                }
              />
              <MethodCard
                id="gcash"
                selected={paymentMethod === "gcash"}
                onClick={setPaymentMethod}
                disabled={!isPaymentAllowed("gcash")}
                icon={<Smartphone size={20} />}
                title="GCash"
                desc={
                  isPaymentAllowed("gcash")
                    ? "Pay through the merchant's configured GCash account"
                    : "Not enabled by this merchant"
                }
              />
              {paymentOptions.error && (
                <p className="rounded-sm border border-red-100 bg-red-50 px-3 py-2 text-[10px] font-bold text-red-600">
                  {paymentOptions.error}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: SUMMARY */}
        <aside className="w-full lg:w-[450px] lg:sticky lg:top-24">
          <div className="bg-white rounded-sm shadow-md border border-gray-100 p-8">
            <h2 className="text-xs font-bold text-[#003366] tracking-wide mb-8 border-b border-gray-50 pb-4">
              Order summary
            </h2>

            <div className="space-y-4 mb-8">
              {checkoutItems.map((item, i) => (
                <div key={`${item.id}-${i}`} className="flex gap-4 items-center">
                  <div className="w-12 h-12 bg-gray-50 border border-gray-100 rounded-sm overflow-hidden shrink-0">
                    <img
                      src={
                        item.img ||
                        (type === "product"
                          ? "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=100"
                          : "https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=100")
                      }
                      className="w-full h-full object-cover"
                      alt="item"
                    />
                  </div>
                  <div className="flex-grow">
                    <p className="text-[10px] font-bold text-gray-700 truncate">
                      {item.name}
                    </p>
                    <p className="text-[9px] text-gray-400 font-semibold">
                      Qty: {item.qty || 1} x ₱
                      {Number(item.price || 0).toFixed(1)}
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-gray-800">
                    ₱
                    {(
                      Number(item.price || 0) * Number(item.qty || 1)
                    ).toFixed(1)}
                  </span>
                </div>
              ))}
              {!hasCheckoutItems && (
                <div className="rounded-md border border-orange-100 bg-orange-50 px-4 py-5 text-center">
                  <p className="text-[11px] font-bold text-[#003366]">
                    No checkout items found.
                  </p>
                  <p className="mt-1 text-[10px] font-semibold text-gray-500">
                    Add a {type} to your cart before placing an order.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-4 border-t border-gray-50 pt-6 mb-8 text-[11px] font-bold text-gray-400 tracking-wider">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-gray-700 font-bold">
                  ₱{subtotal.toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>
                  {type === "product" ? "Shipping / Meetup fee" : "Service Fee"}
                </span>
                <span className="text-gray-700 font-bold">
                  ₱{(type === "product" ? shippingFee : serviceFee).toFixed(1)}
                </span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-500">
                  <span>Voucher discount</span>
                  <span>- ₱{discountAmount.toFixed(1)}</span>
                </div>
              )}
            </div>

            <div className="mb-8 rounded-md border border-gray-200/50 bg-[#F8FAFC] p-5">
              <label className="mb-2 block text-[8px] font-bold tracking-widest text-gray-400">
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
                    onChange={(e) => {
                      setVoucherInput(e.target.value);
                      setVoucherMessage("");
                    }}
                    placeholder="Enter voucher code"
                    className="w-full rounded-sm border border-gray-200 py-2.5 pl-9 pr-2 text-[11px] focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleApplyVoucher}
                  disabled={isApplyingVoucher || !hasCheckoutItems}
                  className="rounded-sm bg-[#003366] px-5 py-2.5 text-[10px] font-bold text-white transition-colors hover:bg-[#002244] disabled:bg-gray-300"
                >
                  {isApplyingVoucher ? "Checking" : "Apply"}
                </button>
              </div>
              {voucherMessage && (
                <p
                  className={`mt-2 text-[10px] font-bold ${
                    voucherMessage.toLowerCase().includes("applied")
                      ? "text-green-600"
                      : "text-red-500"
                  }`}
                >
                  {voucherMessage}
                </p>
              )}
              {appliedVouchers.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {appliedVouchers.map((voucher) => (
                    <span
                      key={voucher.code}
                      className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-[10px] font-bold text-green-700"
                    >
                      {voucher.code} - ₱{Number(voucher.discountAmount || 0).toFixed(1)}
                      <button
                        type="button"
                        onClick={() => handleRemoveVoucher(voucher.code)}
                        className="text-green-500 hover:text-red-500"
                        aria-label={`Remove voucher ${voucher.code}`}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t-2 border-gray-50 pt-6 mb-8 flex justify-between items-baseline">
              <span className="text-[11px] font-bold text-[#003366] tracking-wider">
                Total
              </span>
              <span className="text-2xl font-bold text-[#FF851B]">
                ₱{total.toFixed(1)}
              </span>
            </div>

            {checkoutError && (
              <div className="mb-4 rounded-sm border border-red-100 bg-red-50 px-4 py-3 text-[11px] font-bold text-red-600">
                {checkoutError}
              </div>
            )}

            <button
              onClick={handlePlaceOrder}
              disabled={
                isSubmittingOrder ||
                !hasCheckoutItems ||
                isLoadingAddress ||
                !hasShippingAddress ||
                !isPaymentAllowed(paymentMethod) ||
                !isDeliveryAllowed(deliveryMethod)
              }
              className="w-full bg-[#FF851B] text-white py-4 rounded-md font-bold text-xs tracking-wide hover:bg-[#E67616] transition-all shadow-lg shadow-orange-100 active:scale-95 disabled:bg-gray-300 disabled:shadow-none"
            >
              {isSubmittingOrder
                ? "Validating order..."
                : paymentMethod === "gcash"
                ? "Proceed to GCash"
                : "Place order now"}
            </button>
          </div>
        </aside>
      </div>

      {showGCashModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => !isProcessingGCash && setShowGCashModal(false)}
          ></div>
          <div className="bg-white w-full max-w-[420px] rounded-3xl overflow-hidden relative z-10 shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-[#0055E3] p-5 text-white text-center relative">
              <button
                className="absolute top-4 right-4 opacity-70 hover:opacity-100"
                onClick={() => setShowGCashModal(false)}
              >
                <X size={20} />
              </button>
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/GCash_logo.svg/1200px-GCash_logo.svg.png"
                className="h-5 brightness-0 invert mx-auto mb-2"
                alt="gcash"
              />
              <p className="text-[9px] opacity-80 font-bold uppercase tracking-widest">
                Amount to Pay
              </p>
              <h4 className="text-3xl font-black mt-1">₱{total.toFixed(1)}</h4>
            </div>

            <div className="p-6 text-black">
              {isProcessingGCash ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-10 h-10 border-4 border-[#0055E3] border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-xs font-bold text-[#0055E3] animate-pulse uppercase tracking-widest">
                    Verifying Payment...
                  </p>
                </div>
              ) : (
                <form onSubmit={handleGCashSubmit} className="space-y-4">
                  <div className="space-y-3">
                    {gcashPaymentDetails.map((merchant) =>
                      merchant.methods.map((method) => (
                        <div
                          key={`${merchant.id}-${method.id}`}
                          className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center gap-4"
                        >
                          <div className="w-20 h-20 bg-white p-1.5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-center relative shrink-0 overflow-hidden">
                            {method.qrUrl ? (
                              <img
                                src={method.qrUrl}
                                alt={`${merchant.name} GCash QR`}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <>
                                <QrCode
                                  size={60}
                                  className="text-[#0055E3] opacity-20"
                                />
                                <span className="absolute text-[8px] font-black text-gray-400">
                                  QR
                                </span>
                              </>
                            )}
                          </div>
                          <div className="min-w-0 text-left">
                            <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">
                              Send to Merchant
                            </p>
                            <p className="truncate text-lg font-black text-[#003366]">
                              {method.number || method.username || method.link}
                            </p>
                            <p className="text-[10px] font-bold text-gray-500 italic">
                              {method.username || merchant.name}
                            </p>
                            {method.other && (
                              <p className="mt-1 text-[9px] font-semibold text-gray-400">
                                {method.other}
                              </p>
                            )}
                          </div>
                        </div>
                      )),
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[9px] font-black text-gray-400 uppercase ml-1 tracking-widest">
                        Reference Number
                      </label>
                      <input
                        required
                        type="text"
                        maxLength={13}
                        value={referenceNumber}
                        onChange={(e) =>
                          setReferenceNumber(e.target.value.replace(/\D/g, ""))
                        }
                        placeholder="13-digit number from GCash"
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:border-[#0055E3] outline-none transition-all mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] font-black text-gray-400 uppercase ml-1 tracking-widest">
                        Proof of Payment
                      </label>
                      <div
                        onClick={() => fileInputRef.current.click()}
                        className="mt-1 w-full h-16 border-2 border-dashed border-gray-200 rounded-xl bg-slate-50 flex items-center justify-center cursor-pointer hover:border-[#0055E3] transition-all overflow-hidden"
                      >
                        {paymentScreenshot ? (
                          <img
                            src={paymentScreenshot}
                            className="w-full h-full object-cover"
                            alt="Proof"
                          />
                        ) : (
                          <div className="flex items-center gap-2 text-gray-400">
                            <Upload size={16} />
                            <span className="text-[10px] font-bold uppercase tracking-wide">
                              Upload Screenshot
                            </span>
                          </div>
                        )}
                      </div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#0055E3] text-white py-3.5 rounded-2xl font-black text-xs shadow-lg hover:bg-[#0044B8] transition-all uppercase tracking-widest mt-2"
                  >
                    Confirm Payment
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS POPUP MODAL / RECEIPT (Original Display Maintained) */}
      {showSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 text-black">
          <div
            className="absolute inset-0 bg-[#003366]/40 backdrop-blur-sm transition-opacity"
            onClick={() => setShowSuccess(false)}
          ></div>
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={48} className="text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-[#003366] mb-2 tracking-tight">
                Order placed successfully!
              </h2>

              <div className="bg-gray-50 rounded-md p-4 mt-4 mb-6 border border-gray-100 text-left">
                <div className="flex items-center gap-2 mb-3 border-b border-gray-200 pb-2">
                  <Receipt size={16} className="text-gray-400" />
                  <span className="text-[11px] font-bold text-gray-600 uppercase tracking-widest">
                    Order Details Recorded
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Order Ref:</span>
                    <span className="font-bold text-gray-800">
                      {orderNumber}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Payment Method:</span>
                    <span className="font-bold text-gray-800">
                      {paymentMethod === "gcash" ? "GCash" : "Cash on Delivery"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Payment Status:</span>
                    <span
                      className={`font-black uppercase text-[10px] px-2 py-0.5 rounded-sm ${paymentStatus === "Paid" ? "bg-green-100 text-green-700" : "bg-orange-100 text-[#FF851B]"}`}
                    >
                      {paymentStatus}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-gray-500 text-sm mb-8 leading-relaxed px-2">
                Thank you!{" "}
                {deliveryMethod === "pickup"
                  ? "Please check your IskoChat to finalize the meetup details with the student merchant."
                  : "Your items will be processed soon."}
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => navigate("/profile/orders")}
                  className="w-full bg-[#003366] text-white py-3.5 rounded-md font-bold text-sm hover:bg-[#002244] transition-all flex items-center justify-center gap-2"
                >
                  View my orders
                  <ArrowRight size={18} />
                </button>
                <button
                  onClick={() => navigate("/")}
                  className="w-full bg-white text-gray-500 py-3.5 rounded-md font-bold text-sm border border-gray-200 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                >
                  <ShoppingBag size={18} />
                  Continue shopping
                </button>
              </div>
            </div>
            <div className="h-1.5 bg-[#FF851B] w-full"></div>
          </div>
        </div>
      )}
    </div>
  );
}

function MethodCard({ id, selected, onClick, icon, title, desc, price, disabled }) {
  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      disabled={disabled}
      className={`w-full p-4 border-2 rounded-md flex items-center justify-between cursor-pointer transition-all text-left ${
        disabled
          ? "border-gray-100 bg-gray-100 opacity-60 cursor-not-allowed"
          : selected
          ? "border-[#FF851B] bg-[#FFF7F0]"
          : "border-gray-100 bg-gray-50/30 hover:border-gray-200"
      }`}
    >
      <div className="flex items-center gap-4">
        <div className={selected ? "text-[#FF851B]" : "text-gray-400"}>
          {icon}
        </div>
        <div>
          <p className="text-xs font-bold text-gray-800 tracking-tight">
            {title}
          </p>
          <p className="text-[10px] text-gray-400 font-semibold">{desc}</p>
        </div>
      </div>
      {price && (
        <span className="font-bold text-[#FF851B] text-sm">{price}</span>
      )}
    </button>
  );
}

function formatAddressLine(address) {
  return [
    address.unitFloor,
    address.specific,
    address.city,
    address.province,
    address.region,
    address.postalCode,
  ]
    .filter(Boolean)
    .join(", ");
}
