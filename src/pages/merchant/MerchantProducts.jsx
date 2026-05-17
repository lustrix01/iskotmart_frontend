import React, { useEffect, useRef, useState } from "react";
import {
  Package,
  Wrench,
  Plus,
  Search,
  Filter,
  Edit3,
  Trash2,
  X,
  Image as ImageIcon,
  Check,
  AlertCircle, // Added AlertCircle for the delete modal
} from "lucide-react";

const PRODUCT_CATEGORIES = [
  "Electronics & Technology",
  "Fashion & Apparel",
  "Home & Living",
  "Health & Beauty",
  "Books & Media",
  "Groceries & Essentials",
];

const SERVICE_CATEGORIES = [
  "Creative Services",
  "Academics & Tutoring",
  "Tech Support",
  "Errands & Tasks",
];

export default function MerchantProducts() {
  const [activeTab, setActiveTab] = useState("products");
  const [searchTerm, setSearchTerm] = useState("");
  const fileInputRef = useRef(null);

  // --- MODAL STATES ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null); // New state for delete confirmation
  const [formError, setFormError] = useState("");
  const [formNotice, setFormNotice] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [loadError, setLoadError] = useState("");

  const currentItems = activeTab === "products" ? products : services;

  useEffect(() => {
    let isMounted = true;

    const loadOfferings = async () => {
      try {
        const response = await fetch("/api/merchant_offerings.php", {
          credentials: "include",
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error || "Unable to load merchant catalog.");
        }

        const payload = await response.json();
        if (!isMounted || !Array.isArray(payload.offerings)) {
          return;
        }

        const dbProducts = payload.offerings.filter(
          (item) => item.type === "product",
        );
        const dbServices = payload.offerings.filter(
          (item) => item.type === "service",
        );

        setProducts(dbProducts);
        setServices(dbServices);
      } catch (error) {
        if (isMounted) {
          setLoadError(error.message);
        }
      }
    };

    loadOfferings();

    return () => {
      isMounted = false;
    };
  }, []);

  // --- FORM STATE ---
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    category: PRODUCT_CATEGORIES[0],
    price: 0,
    stock: 0,
    slots: 1,
    rate: "Per Hour",
    status: "Active",
    description: "",
    img: "",
    images: [],
    newImages: [],
    removeImageIds: [],
  });

  const handleOpenModal = (item = null) => {
    setFormError("");
    setFormNotice("");
    if (item) {
      setFormData({
        ...item,
        images: item.images?.length
          ? item.images
          : item.img
            ? [{ id: `${item.id}-image`, url: item.img, isDefault: true }]
            : [],
        newImages: [],
        removeImageIds: [],
      });
      setEditingItem(item);
    } else {
      setFormData({
        name: "",
        category:
          activeTab === "products" ? PRODUCT_CATEGORIES[0] : SERVICE_CATEGORIES[0],
        price: 0,
        stock: 0,
        slots: 1,
        rate: "Per Hour",
        status: "Active",
        description: "",
        img: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?q=80&w=150",
        images: [],
        newImages: [],
        removeImageIds: [],
      });
      setEditingItem(null);
    }
    setIsModalOpen(true);
  };

  const syncItemsFromApi = (offerings) => {
    const dbProducts = offerings.filter((item) => item.type === "product");
    const dbServices = offerings.filter((item) => item.type === "service");

    setProducts(dbProducts);
    setServices(dbServices);
  };

  const imageCount =
    (formData.images?.length || 0) + (formData.newImages?.length || 0);

  const handleImageSelection = (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";

    if (files.length === 0) {
      return;
    }

    if (imageCount + files.length > 5) {
      setFormError("You can attach up to 5 images per item.");
      return;
    }

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    const invalid = files.find(
      (file) => !allowed.includes(file.type) || file.size > 3 * 1024 * 1024,
    );

    if (invalid) {
      setFormError("Images must be JPG, PNG, or WebP and 3 MB or smaller.");
      return;
    }

    setFormError("");
    setFormData((current) => ({
      ...current,
      newImages: [
        ...(current.newImages || []),
        ...files.map((file) => ({
          id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
          file,
          previewUrl: URL.createObjectURL(file),
        })),
      ],
    }));
  };

  const handleRemoveExistingImage = (image) => {
    setFormData((current) => ({
      ...current,
      images: (current.images || []).filter((item) => item.id !== image.id),
      removeImageIds:
        Number.isFinite(Number(image.id)) && Number(image.id) > 0
          ? [...(current.removeImageIds || []), Number(image.id)]
          : current.removeImageIds || [],
    }));
  };

  const handleRemoveNewImage = (image) => {
    URL.revokeObjectURL(image.previewUrl);
    setFormData((current) => ({
      ...current,
      newImages: (current.newImages || []).filter((item) => item.id !== image.id),
    }));
  };

  const saveOfferingToApi = async () => {
    const payload = new FormData();
    payload.append("_method", editingItem ? "PATCH" : "POST");
    payload.append("type", activeTab === "products" ? "product" : "service");
    payload.append("name", formData.name);
    payload.append("category", formData.category);
    payload.append("price", String(formData.price));
    payload.append("stock", String(formData.stock || 0));
    payload.append("slots", String(formData.slots || 1));
    payload.append("rate", formData.rate || "Per Project");
    payload.append("status", formData.status);
    payload.append("description", formData.description || "");
    payload.append(
      "removeImageIds",
      JSON.stringify(formData.removeImageIds || []),
    );

    if (editingItem && Number.isFinite(Number(editingItem.id))) {
      payload.append("id", String(editingItem.id));
    }

    (formData.newImages || []).forEach((image) => {
      payload.append("images[]", image.file);
    });

    const response = await fetch("/api/merchant_offerings.php", {
      method: "POST",
      credentials: "include",
      body: payload,
    });
    const body = await response.json();

    if (!response.ok) {
      throw new Error(body.error || "Unable to save item.");
    }

    syncItemsFromApi(body.offerings || []);
  };

  // --- FR-42 (Add), FR-44 (Edit Details), FR-45 (Set Price) ---
  const handleSave = async () => {
    if (!formData.name.trim()) {
      setFormError("Name is required.");
      return;
    }

    if (Number(formData.price) < 0 || !Number.isInteger(Number(formData.price))) {
      setFormError("Price must be a whole number of pesos.");
      return;
    }

    if (activeTab === "products" && Number(formData.stock) < 0) {
      setFormError("Stock must be zero or greater.");
      return;
    }

    if (
      activeTab === "services" &&
      (!Number.isInteger(Number(formData.slots)) || Number(formData.slots) < 1)
    ) {
      setFormError("Service slots must be at least 1.");
      return;
    }

    setFormError("");
    setFormNotice("");
    setIsSaving(true);

    try {
      await saveOfferingToApi();
      setFormNotice("Item saved to the database.");
      setIsModalOpen(false);
      return;
    } catch (error) {
      setFormError(error.message);
      return;
    } finally {
      setIsSaving(false);
    }
  };

  // --- FR-43: Custom Delete Confirmation Logic ---
  const confirmDelete = async () => {
    if (itemToDelete) {
      const payload = new FormData();
      payload.append("_method", "DELETE");
      payload.append("id", String(itemToDelete.id));

      const response = await fetch("/api/merchant_offerings.php", {
        method: "POST",
        credentials: "include",
        body: payload,
      });
      const body = await response.json().catch(() => ({}));

      if (response.ok) {
        syncItemsFromApi(body.offerings || []);
      } else {
        setLoadError(body.error || "Unable to delete item.");
      }
      setItemToDelete(null); // Close the modal
    }
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto space-y-6 relative">
      {/* HEADER */}
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

      {/* TABS & SEARCH */}
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

      {/* TABLE */}
      {loadError && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-xs font-bold text-red-600">
          {loadError}
        </div>
      )}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-gray-100 text-[10px] font-bold text-[#003366] uppercase tracking-[0.2em]">
                <th className="p-5 pl-8">Item Info</th>
                <th className="p-5">Category</th>
                <th className="p-5">Price</th>
	                <th className="p-5">
	                  {activeTab === "products" ? "Stock" : "Slots / Rate"}
	                </th>
                <th className="p-5">Status</th>
                <th className="p-5 pr-8 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-xs font-medium text-gray-600">
              {currentItems
                .filter((item) =>
                  item.name.toLowerCase().includes(searchTerm.toLowerCase()),
                )
                .map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group"
                  >
                    <td className="p-5 pl-8">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 border border-gray-100 shrink-0">
                          <img
                            src={
                              item.img ||
                              item.images?.[0]?.url ||
                              "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?q=80&w=150"
                            }
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(event) => {
                              event.currentTarget.src =
                                "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?q=80&w=150";
                            }}
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
	                        <span className="font-bold text-gray-500">
	                          {item.slots || 0}{" "}
	                          <span className="text-[10px] font-normal text-gray-400 ml-1">
	                            slots
	                          </span>
	                          <span className="block text-[10px] font-normal text-gray-400 mt-1">
	                            {item.rate}
	                          </span>
	                        </span>
	                      )}
                    </td>
                    <td className="p-5">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 w-fit ${item.status === "Active" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}
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
                        {/* --- Trigger Custom Delete Modal Here --- */}
                        <button
                          onClick={() => setItemToDelete(item)}
                          className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              {currentItems.filter((item) =>
                item.name.toLowerCase().includes(searchTerm.toLowerCase()),
              ).length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="p-10 text-center text-xs font-bold text-gray-400"
                  >
                    No merchant-owned {activeTab} found in the database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- ADD/EDIT MODAL (Slide-over Simulation) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div
            className="absolute inset-0 bg-[#003366]/40 backdrop-blur-sm animate-in fade-in"
            onClick={() => setIsModalOpen(false)}
          ></div>
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
                  Item Images
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={handleImageSelection}
                />
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      fileInputRef.current?.click();
                    }
                  }}
                  className="w-full min-h-40 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-4 cursor-pointer hover:bg-gray-100 transition-all group"
                >
                  {imageCount > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {(formData.images || []).map((image) => (
                        <div
                          key={image.id}
                          className="relative aspect-video rounded-xl overflow-hidden bg-white border border-gray-100"
                        >
                          <img
                            src={image.url}
                            className="w-full h-full object-cover"
                            alt="Uploaded item"
                            onError={(event) => {
                              event.currentTarget.src =
                                "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?q=80&w=300";
                            }}
                          />
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleRemoveExistingImage(image);
                            }}
                            className="absolute right-2 top-2 p-1.5 rounded-full bg-white/90 text-red-500 shadow-sm hover:bg-red-500 hover:text-white transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                      {(formData.newImages || []).map((image) => (
                        <div
                          key={image.id}
                          className="relative aspect-video rounded-xl overflow-hidden bg-white border border-gray-100"
                        >
                          <img
                            src={image.previewUrl}
                            className="w-full h-full object-cover"
                            alt="New item preview"
                          />
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleRemoveNewImage(image);
                            }}
                            className="absolute right-2 top-2 p-1.5 rounded-full bg-white/90 text-red-500 shadow-sm hover:bg-red-500 hover:text-white transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                      {imageCount < 5 && (
                        <div className="aspect-video rounded-xl border border-dashed border-gray-200 bg-white flex flex-col items-center justify-center gap-2 text-gray-400">
                          <ImageIcon size={24} />
                          <span className="text-[10px] font-bold uppercase">
                            Add more
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-36 flex flex-col items-center justify-center gap-3">
                      <div className="p-4 bg-white rounded-full text-gray-300 group-hover:text-[#FF851B] transition-colors shadow-sm">
                        <ImageIcon size={32} />
                      </div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">
                        Click to upload photos
                      </p>
                    </div>
                  )}
                </div>
                <p className="text-[10px] font-semibold text-gray-400">
                  Up to 5 images. JPG, PNG, or WebP. 3 MB max each.
                </p>
                {formError && (
                  <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[11px] font-bold text-red-600 flex items-center gap-2">
                    <AlertCircle size={14} /> {formError}
                  </div>
                )}
                {formNotice && (
                  <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-[11px] font-bold text-[#0074D9]">
                    {formNotice}
                  </div>
                )}
              </div>

              {/* Form Fields */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-[#FF851B] outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={5}
                    maxLength={1000}
                    placeholder={`Describe this ${activeTab === "products" ? "product" : "service"} for customers.`}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-[#FF851B] outline-none transition-all resize-none leading-relaxed"
                  />
                  <p className="text-[10px] font-semibold text-gray-400">
                    {(formData.description || "").length}/1000 characters
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-[#FF851B] outline-none transition-all appearance-none"
                    >
	                      {(activeTab === "products"
	                        ? PRODUCT_CATEGORIES
	                        : SERVICE_CATEGORIES
	                      ).map((category) => (
	                        <option key={category}>{category}</option>
	                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                      Price (₱)
                    </label>
	                    <input
	                      type="number"
	                      min="0"
	                      step="1"
	                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
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
                      value={formData.stock}
                      onChange={(e) =>
                        setFormData({ ...formData, stock: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-[#FF851B] outline-none transition-all"
                    />
                  </div>
	                ) : (
	                  <div className="grid grid-cols-2 gap-4">
	                    <div className="space-y-2">
	                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
	                        Open Slots
	                      </label>
	                      <input
	                        type="number"
	                        min="1"
	                        step="1"
	                        value={formData.slots || 1}
	                        onChange={(e) =>
	                          setFormData({ ...formData, slots: e.target.value })
	                        }
	                        className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-[#FF851B] outline-none transition-all"
	                      />
	                    </div>
	                    <div className="space-y-2">
	                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
	                        Rate Type
	                      </label>
	                      <select
	                        value={formData.rate}
	                        onChange={(e) =>
	                          setFormData({ ...formData, rate: e.target.value })
	                        }
	                        className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-[#FF851B] outline-none transition-all appearance-none"
	                      >
	                        <option>Per Hour</option>
	                        <option>Per Project</option>
	                      </select>
	                    </div>
	                  </div>
	                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-[#FF851B] outline-none transition-all appearance-none"
                  >
                    <option>Active</option>
                    <option>Out of Stock</option>
                    <option>Hidden</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-3.5 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50 transition-all border border-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 py-3.5 rounded-xl text-xs font-bold text-white bg-[#003366] hover:bg-[#002244] shadow-lg shadow-blue-900/10 transition-all flex items-center justify-center gap-2"
              >
                <Check size={16} />{" "}
                {isSaving
                  ? "Saving..."
                  : editingItem
                    ? "Save Changes"
                    : "Create Item"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- FR-43: DELETE CONFIRMATION MODAL --- */}
      {itemToDelete && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#003366]/40 backdrop-blur-sm animate-in fade-in"
            onClick={() => setItemToDelete(null)}
          ></div>
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-sm relative z-10 overflow-hidden animate-in zoom-in duration-200">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={32} className="text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-[#003366] mb-2">
                Delete Item?
              </h3>
              <p className="text-gray-500 text-xs mb-6 px-2">
                Are you sure you want to delete{" "}
                <span className="font-bold text-gray-800">
                  {itemToDelete.name}
                </span>
                ? This action cannot be undone.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={confirmDelete}
                  className="w-full bg-red-500 text-white py-3.5 rounded-xl font-bold text-xs hover:bg-red-600 transition-colors shadow-md"
                >
                  Yes, Delete Item
                </button>
                <button
                  onClick={() => setItemToDelete(null)}
                  className="w-full bg-white border border-gray-200 text-gray-500 py-3.5 rounded-xl font-bold text-xs hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
