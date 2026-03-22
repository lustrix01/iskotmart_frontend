import React, { useState } from "react";
import {
  Search,
  Filter,
  Eye,
  Edit2,
  UserX,
  UserCheck,
  X,
  CheckCircle,
  User,
  Store,
  Users,
  UserPlus,
  AlertCircle,
} from "lucide-react";

export default function AccountManagement() {
  // --- STATE ---
  const [activeTab, setActiveTab] = useState("Merchants");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [notification, setNotification] = useState(null);

  const [users, setUsers] = useState([
    {
      id: 1,
      name: "Juan Dela Cruz",
      email: "juan.dc@student.bu.edu",
      role: "Customer",
      status: "Active",
      joined: "2026-01-15",
      reports: 0,
    },
    {
      id: 2,
      name: "TechHub Store",
      email: "contact@techhub.ph",
      role: "Merchant",
      status: "Active",
      joined: "2026-02-10",
      reports: 0,
    },
    {
      id: 3,
      name: "Maria Clara",
      email: "m.clara@student.bu.edu",
      role: "Customer",
      status: "Flagged",
      joined: "2026-02-28",
      reports: 5,
    },
    {
      id: 4,
      name: "Fashion Express",
      email: "fashion@store.com",
      role: "Merchant",
      status: "Suspended",
      joined: "2025-11-20",
      reports: 12,
    },
    {
      id: 5,
      name: "Bad Actor",
      email: "scammer@gmail.com",
      role: "Customer",
      status: "Banned",
      joined: "2026-03-01",
      reports: 45,
    },
  ]);

  // --- HANDLERS ---
  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleUpdateStatus = (id, newStatus) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: newStatus } : u)),
    );
    showToast(`Account ${newStatus} successfully.`);
    setSelectedUser(null);
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    if (activeTab === "Merchants")
      return matchesSearch && u.role === "Merchant" && u.status === "Active";
    if (activeTab === "Customers")
      return matchesSearch && u.role === "Customer" && u.status === "Active";
    if (activeTab === "Flagged") return matchesSearch && u.status === "Flagged";
    if (activeTab === "Suspended")
      return matchesSearch && u.status === "Suspended";
    if (activeTab === "Banned") return matchesSearch && u.status === "Banned";
    return matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20 relative">
      {/* --- TOAST --- */}
      {notification && (
        <div className="fixed top-24 right-8 z-[100] bg-[#003366] text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right">
          <CheckCircle size={18} className="text-green-400" />
          <span className="text-xs font-black uppercase tracking-tight">
            {notification}
          </span>
        </div>
      )}

      {/* --- REFINED ACTION BAR --- */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2">
        {/* Scaled-up Subtle Badges */}
        <div className="flex items-center gap-6">
          <SubtleBadge icon={<Users size={18} />} label="3.2k Total Accounts" />
          <SubtleBadge
            icon={<UserPlus size={18} />}
            label="12 New Today"
            color="text-green-500"
          />
          <SubtleBadge
            icon={<AlertCircle size={18} />}
            label="5 Flagged"
            color="text-red-500"
          />
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-grow lg:flex-grow-0">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search user..."
              className="pl-12 pr-6 py-3 bg-white border border-gray-100 rounded-2xl text-xs font-semibold text-[#003366] outline-none shadow-sm focus:ring-2 focus:ring-blue-50 w-full lg:w-72 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="p-3 bg-white border border-gray-100 rounded-2xl text-[#003366] shadow-sm hover:bg-gray-50 transition-all">
            <Filter size={20} />
          </button>
        </div>
      </div>

      {/* --- WIDE TAB SYSTEM --- */}
      <div className="flex w-full p-2 bg-white rounded-[24px] border border-gray-100 shadow-sm">
        {["Merchants", "Customers", "Flagged", "Suspended", "Banned"].map(
          (tab) => {
            const count = users.filter((u) => {
              if (tab === "Merchants")
                return u.role === "Merchant" && u.status === "Active";
              if (tab === "Customers")
                return u.role === "Customer" && u.status === "Active";
              return u.status === tab;
            }).length;

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-[20px] text-[11px] font-bold uppercase tracking-widest transition-all ${
                  activeTab === tab
                    ? "bg-[#003366] text-white shadow-lg shadow-blue-900/10"
                    : "text-gray-400 hover:text-[#003366] hover:bg-slate-50"
                }`}
              >
                {tab}
                {count > 0 && (
                  <span
                    className={`px-2 py-0.5 rounded-md text-[9px] ${activeTab === tab ? "bg-white/20 text-white" : "bg-slate-100 text-gray-400"}`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          },
        )}
      </div>

      {/* --- ACCOUNT TABLE --- */}
      <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[#F9FAFB] border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-[2px]">
            <tr>
              <th className="px-10 py-5">User Details</th>
              <th className="px-10 py-5">Role</th>
              <th className="px-10 py-5">Joined Date</th>
              <th className="px-10 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="group hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-2xl bg-slate-100 text-[#003366] flex items-center justify-center">
                        {user.role === "Merchant" ? (
                          <Store size={20} />
                        ) : (
                          <User size={20} />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#003366]">
                          {user.name}
                        </p>
                        <p className="text-[10px] text-gray-400 font-medium lowercase tracking-tight">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-xl ${user.role === "Merchant" ? "bg-blue-50 text-[#0074D9]" : "bg-orange-50 text-[#FF851B]"}`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-10 py-6 text-xs font-bold text-gray-400">
                    {user.joined}
                  </td>
                  <td className="px-10 py-6 text-right">
                    {/* Actions are now visible all the time */}
                    <div className="flex justify-end gap-2">
                      <ActionBtn
                        onClick={() => setSelectedUser(user)}
                        icon={<Eye size={16} />}
                      />
                      <ActionBtn
                        onClick={() => showToast(`Edit: ${user.name}`)}
                        icon={<Edit2 size={16} />}
                      />
                      {user.status === "Banned" ||
                      user.status === "Suspended" ? (
                        <ActionBtn
                          onClick={() => handleUpdateStatus(user.id, "Active")}
                          icon={<UserCheck size={16} />}
                          color="green"
                        />
                      ) : (
                        <ActionBtn
                          onClick={() =>
                            handleUpdateStatus(user.id, "Suspended")
                          }
                          icon={<UserX size={16} />}
                          color="red"
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="4"
                  className="py-20 text-center text-gray-300 font-bold italic"
                >
                  No accounts found in this category.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- PROFILE SLIDE-OVER --- */}
      {selectedUser && (
        <div className="fixed inset-0 z-[110] flex justify-end">
          <div
            className="absolute inset-0 bg-[#003366]/40 backdrop-blur-sm"
            onClick={() => setSelectedUser(null)}
          ></div>
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#003366] text-white rounded-2xl flex items-center justify-center font-black text-lg">
                  {selectedUser.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#003366]">
                    {selectedUser.name}
                  </h3>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    {selectedUser.status}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-grow p-8 overflow-y-auto space-y-8">
              <div className="grid grid-cols-2 gap-4">
                <InfoBlock label="Email Address" value={selectedUser.email} />
                <InfoBlock
                  label="Joined Iskomart"
                  value={selectedUser.joined}
                />
                <InfoBlock label="Account Type" value={selectedUser.role} />
                <InfoBlock label="Total Reports" value={selectedUser.reports} />
              </div>
            </div>
            <div className="p-8 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => handleUpdateStatus(selectedUser.id, "Banned")}
                className="flex-1 py-4 bg-red-50 text-red-500 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
              >
                Ban Account
              </button>
              <button
                onClick={() => showToast("Warning sent")}
                className="flex-1 py-4 bg-[#003366] text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-[#002244] shadow-lg shadow-blue-900/20 transition-all"
              >
                Send Warning
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- UPDATED SUB-COMPONENTS ---

function SubtleBadge({ icon, label, color = "text-gray-400" }) {
  return (
    <div className="flex items-center gap-3 px-1 transition-all">
      <div className={`${color} bg-opacity-10 p-1.5`}>{icon}</div>
      <span className="text-xs font-bold text-gray-500 uppercase tracking-tighter">
        {label}
      </span>
    </div>
  );
}

function ActionBtn({ icon, onClick, color = "blue" }) {
  const styles = {
    blue: "bg-gray-50 text-gray-400 hover:bg-[#003366] hover:text-white",
    green: "bg-green-50 text-green-500 hover:bg-green-500 hover:text-white",
    red: "bg-red-50 text-red-500 hover:bg-red-500 hover:text-white",
  };
  return (
    <button
      onClick={onClick}
      className={`p-3 rounded-2xl transition-all active:scale-95 shadow-sm ${styles[color]}`}
    >
      {icon}
    </button>
  );
}

function InfoBlock({ label, value }) {
  return (
    <div>
      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter mb-1">
        {label}
      </p>
      <p className="text-xs font-bold text-[#003366] truncate">{value}</p>
    </div>
  );
}
