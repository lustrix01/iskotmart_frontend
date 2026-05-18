import { useEffect, useState } from "react";
import {
  Plus,
  Home,
  Building2,
  Pencil,
  Trash2,
  Phone,
  Star,
  X,
  CheckCircle2,
  XCircle,
} from "lucide-react";

const emptyForm = {
  id: null,
  recipientName: "",
  phone: "",
  region: "",
  province: "",
  city: "",
  specific: "",
  unitFloor: "",
  postalCode: "",
  category: "Home",
  isDefault: false,
};

export default function Addresses() {
  const [addresses, setAddresses] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);

  const loadAddresses = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/addresses.php", {
        method: "GET",
        credentials: "include",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Unable to load addresses.");
      }

      setAddresses(payload.addresses || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const openCreateForm = () => {
    setForm({ ...emptyForm, isDefault: addresses.length === 0 });
    setError("");
    setSuccess("");
    setIsFormOpen(true);
  };

  const openEditForm = (address) => {
    setForm({ ...emptyForm, ...address });
    setError("");
    setSuccess("");
    setIsFormOpen(true);
  };

  const closeForm = () => {
    if (!isSaving) {
      setIsFormOpen(false);
      setForm(emptyForm);
    }
  };

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const applyAddressPayload = (payload, fallbackMessage) => {
    setAddresses(payload.addresses || []);
    setSuccess(fallbackMessage);
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccess("");

    const isEditing = Boolean(form.id);

    try {
      const response = await fetch("/api/addresses.php", {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Unable to save address.");
      }

      applyAddressPayload(
        payload,
        isEditing ? "Address updated." : "Address added.",
      );
      setIsFormOpen(false);
      setForm(emptyForm);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteAddress = async (address) => {
    if (!window.confirm(`Delete ${address.category || "this address"}?`)) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/addresses.php", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: address.id }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Unable to delete address.");
      }

      applyAddressPayload(payload, "Address deleted.");
    } catch (err) {
      setError(err.message);
    }
  };

  const setDefaultAddress = async (address) => {
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/addresses.php", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...address, isDefault: true }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Unable to set default address.");
      }

      applyAddressPayload(payload, "Default address updated.");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-500">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-xl font-bold text-[#003366]">My addresses</h1>
          <p className="text-xs text-gray-400 mt-1">
            Manage your delivery locations and shipping preferences
          </p>
        </div>
        <button
          onClick={openCreateForm}
          className="flex items-center gap-2 bg-[#003366] text-white px-5 py-2.5 rounded-md text-xs font-bold hover:bg-[#002244] transition-all shadow-md active:scale-95"
        >
          <Plus size={16} />
          Add new address
        </button>
      </div>

      {error && (
        <StatusMessage tone="error" message={error} />
      )}
      {success && (
        <StatusMessage tone="success" message={success} />
      )}

      {isLoading ? (
        <div className="bg-white border border-gray-100 rounded-xl p-12 text-center text-sm font-bold text-gray-400">
          Loading addresses...
        </div>
      ) : addresses.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-12 text-center">
          <Home size={42} className="mx-auto text-gray-300 mb-4" />
          <p className="text-sm font-bold text-[#003366]">
            No saved addresses yet.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Add an address to use it during checkout.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              onEdit={() => openEditForm(address)}
              onDelete={() => deleteAddress(address)}
              onSetDefault={() => setDefaultAddress(address)}
            />
          ))}
        </div>
      )}

      {isFormOpen && (
        <AddressFormModal
          form={form}
          isSaving={isSaving}
          onClose={closeForm}
          onSubmit={handleSubmit}
          onChange={updateField}
        />
      )}
    </div>
  );
}

function StatusMessage({ tone, message }) {
  const isError = tone === "error";
  const Icon = isError ? XCircle : CheckCircle2;

  return (
    <div
      className={`mb-6 flex items-center gap-2 rounded-md border px-4 py-3 text-xs font-bold ${
        isError
          ? "border-red-100 bg-red-50 text-red-600"
          : "border-green-100 bg-green-50 text-green-600"
      }`}
    >
      <Icon size={16} />
      {message}
    </div>
  );
}

function AddressCard({ address, onEdit, onDelete, onSetDefault }) {
  const Icon = address.category?.toLowerCase().includes("home")
    ? Home
    : Building2;
  const addressLine = [
    address.unitFloor,
    address.specific,
    address.city,
    address.province,
    address.region,
    address.postalCode,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div
      className={`rounded-xl p-8 shadow-sm relative overflow-hidden ${
        address.isDefault
          ? "bg-[#FFF7F0] border-2 border-[#FF851B]"
          : "bg-white border border-gray-100 hover:border-gray-200"
      }`}
    >
      {address.isDefault && (
        <div className="absolute top-0 right-0">
          <div className="bg-[#FF851B] text-white px-4 py-1.5 text-[10px] font-bold rounded-bl-xl">
            Default address
          </div>
        </div>
      )}

      <div className="flex items-start gap-6">
        <div
          className={`p-3 rounded-full ${
            address.isDefault ? "bg-[#FF851B]/10" : "bg-gray-50"
          }`}
        >
          <Icon
            className={address.isDefault ? "text-[#FF851B]" : "text-gray-400"}
            size={20}
          />
        </div>

        <div className="flex-grow space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-bold text-gray-800">
              {address.category || "Address"}
            </span>
            <span className="text-gray-300">|</span>
            <span className="text-sm font-bold text-gray-800">
              {address.recipientName}
            </span>
          </div>

          <div className="text-xs text-gray-500 leading-relaxed max-w-2xl">
            {addressLine}
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-400 font-semibold">
            <Phone size={14} className="text-gray-300" />
            {address.phone}
          </div>

          <div className="flex flex-wrap gap-6 pt-4">
            <button
              onClick={onEdit}
              className="flex items-center gap-1.5 text-xs font-bold text-[#003366] hover:underline"
            >
              <Pencil size={14} /> Edit
            </button>
            <button
              onClick={onDelete}
              className="flex items-center gap-1.5 text-xs font-bold text-gray-300 hover:text-red-500 transition-colors"
            >
              <Trash2 size={14} /> Delete
            </button>
            {!address.isDefault && (
              <button
                onClick={onSetDefault}
                className="flex items-center gap-1.5 text-xs font-bold text-gray-300 hover:text-[#FF851B] transition-colors"
              >
                <Star size={14} /> Set as default
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AddressFormModal({ form, isSaving, onClose, onSubmit, onChange }) {
  const isEditing = Boolean(form.id);

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close address form"
        className="absolute inset-0 bg-[#003366]/20 backdrop-blur-sm"
        onClick={onClose}
      />

      <form
        onSubmit={onSubmit}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden border border-gray-100"
      >
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
          <h2 className="text-sm font-bold text-[#003366]">
            {isEditing ? "Edit address" : "Add new address"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-300 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-5">
          <AddressInput
            label="Recipient name"
            value={form.recipientName}
            onChange={(value) => onChange("recipientName", value)}
            required
          />
          <AddressInput
            label="Phone number"
            value={form.phone}
            onChange={(value) => onChange("phone", value)}
            required
          />
          <AddressInput
            label="Region"
            value={form.region}
            onChange={(value) => onChange("region", value)}
            required
          />
          <AddressInput
            label="Province"
            value={form.province}
            onChange={(value) => onChange("province", value)}
            required
          />
          <AddressInput
            label="City or municipality"
            value={form.city}
            onChange={(value) => onChange("city", value)}
            required
          />
          <AddressInput
            label="Postal code"
            value={form.postalCode || ""}
            onChange={(value) => onChange("postalCode", value)}
          />
          <AddressInput
            label="Unit or floor"
            value={form.unitFloor || ""}
            onChange={(value) => onChange("unitFloor", value)}
          />
          <AddressInput
            label="Label"
            value={form.category}
            onChange={(value) => onChange("category", value)}
            required
          />
          <div className="md:col-span-2">
            <AddressInput
              label="Street, building, barangay"
              value={form.specific}
              onChange={(value) => onChange("specific", value)}
              required
            />
          </div>
          <label className="md:col-span-2 flex items-center gap-3 text-xs font-bold text-gray-500">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(event) => onChange("isDefault", event.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-[#FF851B] focus:ring-[#FF851B]"
            />
            Set as default address
          </label>
        </div>

        <div className="px-8 py-5 bg-[#F8FAFC] flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-md text-xs font-bold text-gray-500 border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-70"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-md text-xs font-bold text-white bg-[#FF851B] hover:bg-[#E67616] disabled:opacity-70"
          >
            {isSaving ? "Saving..." : "Save address"}
          </button>
        </div>
      </form>
    </div>
  );
}

function AddressInput({ label, value, onChange, required = false }) {
  return (
    <label className="space-y-2">
      <span className="block text-[11px] font-bold text-gray-500 tracking-wide ml-1">
        {label}
      </span>
      <input
        type="text"
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:border-[#003366] transition-all"
      />
    </label>
  );
}
