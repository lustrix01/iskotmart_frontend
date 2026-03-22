import React, { useState } from "react";
import {
  History,
  Save,
  CheckCircle,
  Percent,
  CreditCard,
  Zap,
  Clock,
} from "lucide-react";

export default function OperationalCosts() {
  // --- NOTIFICATION STATE ---
  const [notification, setNotification] = useState(null);

  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // --- SETTINGS STATE ---
  const [commissionSettings, setCommissionSettings] = useState({
    platform: "10",
    transaction: "2.5",
    minAmount: "500",
  });

  const [subscriptionFees, setSubscriptionFees] = useState({
    basic: "0",
    premium: "499",
    enterprise: "999",
  });

  const [additionalFees, setAdditionalFees] = useState({
    featured: "150",
    promoted: "50",
    payout: "2",
  });

  // --- HANDLERS ---
  const handleSave = (section) => {
    showToast(`${section} settings updated successfully!`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20 relative pt-4">
      {/* --- TOAST NOTIFICATION --- */}
      {notification && (
        <div className="fixed top-24 right-8 z-[100] bg-[#003366] text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right">
          <CheckCircle size={18} className="text-green-400" />
          <span className="text-xs font-bold">{notification}</span>
        </div>
      )}

      {/* --- SETTINGS GRID --- */}
      <div className="grid grid-cols-1 gap-8">
        {/* Section 1: Platform Commission */}
        <SettingsCard
          title="Platform Commission Settings"
          onSave={() => handleSave("Commission")}
          inputs={[
            {
              label: "Platform Commission (%)",
              sub: "Percentage taken from each transaction",
              value: commissionSettings.platform,
              setter: (v) =>
                setCommissionSettings({ ...commissionSettings, platform: v }),
            },
            {
              label: "Transaction Fee (%)",
              sub: "Additional processing fee per transaction",
              value: commissionSettings.transaction,
              setter: (v) =>
                setCommissionSettings({
                  ...commissionSettings,
                  transaction: v,
                }),
            },
            {
              label: "Min. Transaction Amount (₱)",
              sub: "Minimum amount for commission calculation",
              value: commissionSettings.minAmount,
              setter: (v) =>
                setCommissionSettings({ ...commissionSettings, minAmount: v }),
            },
          ]}
        />

        {/* Section 2: Merchant Subscription Fees */}
        <SettingsCard
          title="Merchant Subscription Fees"
          onSave={() => handleSave("Subscription")}
          inputs={[
            {
              label: "Basic Plan (₱/month)",
              sub: "Free tier for small merchants",
              value: subscriptionFees.basic,
              setter: (v) =>
                setSubscriptionFees({ ...subscriptionFees, basic: v }),
            },
            {
              label: "Premium Plan (₱/month)",
              sub: "Premium features and lower fees",
              value: subscriptionFees.premium,
              setter: (v) =>
                setSubscriptionFees({ ...subscriptionFees, premium: v }),
            },
            {
              label: "Enterprise Plan (₱/month)",
              sub: "Full features and priority support",
              value: subscriptionFees.enterprise,
              setter: (v) =>
                setSubscriptionFees({ ...subscriptionFees, enterprise: v }),
            },
          ]}
        />

        {/* Section 3: Additional Fees */}
        <SettingsCard
          title="Additional Platform Fees"
          onSave={() => handleSave("Additional Fee")}
          inputs={[
            {
              label: "Featured Listing Fee (₱)",
              sub: "Cost to feature a product listing",
              value: additionalFees.featured,
              setter: (v) =>
                setAdditionalFees({ ...additionalFees, featured: v }),
            },
            {
              label: "Promoted Store Fee (₱/day)",
              sub: "Daily cost for store promotion",
              value: additionalFees.promoted,
              setter: (v) =>
                setAdditionalFees({ ...additionalFees, promoted: v }),
            },
            {
              label: "Early Payout Fee (%)",
              sub: "Fee for early withdrawal of earnings",
              value: additionalFees.payout,
              setter: (v) =>
                setAdditionalFees({ ...additionalFees, payout: v }),
            },
          ]}
        />
      </div>

      {/* --- RECENT CHANGES LOG --- */}
      <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden mt-6">
        <div className="p-8 border-b border-gray-50 flex items-center gap-3">
          <History size={18} className="text-[#003366]" />
          <h3 className="text-sm font-bold text-[#003366]">
            Recent Setting Changes
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#F9FAFB] text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              <tr>
                <th className="px-10 py-5">Date</th>
                <th className="px-10 py-5">Setting Name</th>
                <th className="px-10 py-5">Previous</th>
                <th className="px-10 py-5">New Value</th>
                <th className="px-10 py-5 text-right">Changed By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-xs">
              <ChangeRow
                date="Feb 20, 2026"
                setting="Platform Commission"
                prev="8%"
                current="10%"
                admin="Super Admin"
              />
              <ChangeRow
                date="Feb 15, 2026"
                setting="Transaction Fee"
                prev="1.5%"
                current="2.5%"
                admin="System Root"
              />
              <ChangeRow
                date="Feb 10, 2026"
                setting="Premium Plan Fee"
                prev="₱400"
                current="₱499"
                admin="Super Admin"
              />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function SettingsCard({ title, inputs, onSave }) {
  return (
    <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm p-8 group">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-sm font-bold text-[#003366]">{title}</h3>
        <button
          onClick={onSave}
          className="bg-[#FF851B] text-white px-6 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-wider shadow-lg shadow-orange-500/10 hover:shadow-orange-500/30 hover:-translate-y-0.5 transition-all flex items-center gap-2"
        >
          <Save size={14} /> Save Changes
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {inputs.map((input, i) => (
          <div key={i} className="space-y-2.5">
            <label className="text-[11px] font-semibold text-gray-500">
              {input.label}
            </label>
            <input
              type="text"
              value={input.value}
              onChange={(e) => input.setter(e.target.value)}
              className="w-full bg-slate-50 border border-transparent rounded-2xl py-3.5 px-6 text-sm font-semibold text-[#003366] focus:bg-white focus:border-blue-100 focus:ring-4 focus:ring-blue-50/50 transition-all outline-none"
            />
            <p className="text-[9px] font-medium text-gray-400 italic leading-relaxed">
              {input.sub}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChangeRow({ date, setting, prev, current, admin }) {
  return (
    <tr className="hover:bg-slate-50/50 transition-colors">
      <td className="px-10 py-5 text-gray-400 font-medium">{date}</td>
      <td className="px-10 py-5 text-[#003366] font-semibold">{setting}</td>
      <td className="px-10 py-5 text-gray-400 line-through decoration-red-200">
        {prev}
      </td>
      <td className="px-10 py-5 text-green-500 font-bold">{current}</td>
      <td className="px-10 py-5 text-right text-gray-500 font-medium">
        {admin}
      </td>
    </tr>
  );
}
