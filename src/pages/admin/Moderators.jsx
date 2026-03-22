import React, { useState } from "react";
import {
  Search,
  Filter,
  UserPlus,
  Edit2,
  UserX,
  UserCheck,
  X,
  CheckCircle,
  MoreVertical,
  ShieldCheck,
  Mail,
  Clock,
} from "lucide-react";

export default function Moderators() {
  // --- STATE ---
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMod, setEditingMod] = useState(null);
  const [notification, setNotification] = useState(null);

  const [mods, setMods] = useState([
    {
      id: 1,
      name: "Owhie S. Lumbang",
      email: "osl2023-5510@bicol-u.edu.ph",
      role: "Content Moderator",
      status: "Active",
      lastActive: "2 hours ago",
    },
    {
      id: 2,
      name: "Mark Anthony",
      email: "ma2023-4420@bicol-u.edu.ph",
      role: "Support Lead",
      status: "Active",
      lastActive: "1 hour ago",
    },
    {
      id: 3,
      name: "Sarah Jenkins",
      email: "sarah.j@iskomart.com",
      role: "Verification Officer",
      status: "Inactive",
      lastActive: "3 days ago",
    },
  ]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "Content Moderator",
  });

  // --- HANDLERS ---
  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleToggleStatus = (id, currentStatus) => {
    const newStatus = currentStatus === "Active" ? "Inactive" : "Active";
    setMods((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: newStatus } : m)),
    );
    showToast(`Moderator status set to ${newStatus}`);
  };

  const openModal = (mod = null) => {
    if (mod) {
      setEditingMod(mod);
      setFormData({ name: mod.name, email: mod.email, role: mod.role });
    } else {
      setEditingMod(null);
      setFormData({ name: "", email: "", role: "Content Moderator" });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (editingMod) {
      setMods((prev) =>
        prev.map((m) => (m.id === editingMod.id ? { ...m, ...formData } : m)),
      );
      showToast("Moderator details updated");
    } else {
      setMods([
        ...mods,
        {
          ...formData,
          id: Date.now(),
          status: "Active",
          lastActive: "Just now",
        },
      ]);
      showToast("New moderator added successfully");
    }
    setIsModalOpen(false);
  };

  const filteredMods = mods.filter(
    (m) =>
      (m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.email.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (filterStatus === "All" || m.status === filterStatus),
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20 relative">
      {/* --- TOAST --- */}
      {notification && (
        <div className="fixed top-24 right-8 z-[100] bg-[#003366] text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right">
          <CheckCircle size={18} className="text-green-400" />
          <span className="text-xs font-semibold">{notification}</span>
        </div>
      )}

      {/* --- ACTION BAR --- */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-100 pb-6">
        <button
          onClick={() => openModal()}
          className="flex items-center justify-center gap-2 bg-[#FF851B] text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-orange-500/10 hover:shadow-orange-500/20 transition-all"
        >
          <UserPlus size={16} /> Add Moderator
        </button>

        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-grow lg:flex-grow-0">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"
              size={16}
            />
            <input
              type="text"
              placeholder="Search staff..."
              className="pl-10 pr-6 py-2.5 bg-white border border-gray-100 rounded-xl text-xs font-medium text-[#003366] outline-none shadow-sm focus:ring-1 focus:ring-blue-100 w-full lg:w-64 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="bg-white border border-gray-100 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-500 outline-none shadow-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* --- MODERATORS TABLE --- */}
      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[#F9FAFB] border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            <tr>
              <th className="px-8 py-5">Moderator Details</th>
              <th className="px-8 py-5">Role</th>
              <th className="px-8 py-5">Last Activity</th>
              <th className="px-8 py-5">Status</th>
              <th className="px-8 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredMods.map((mod) => (
              <tr
                key={mod.id}
                className="hover:bg-slate-50/30 transition-colors"
              >
                <td className="px-8 py-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0074D9] flex items-center justify-center font-bold">
                      {mod.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#003366]">
                        {mod.name}
                      </p>
                      <p className="text-[10px] text-gray-400 font-medium lowercase">
                        {mod.email}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <span className="text-[10px] font-semibold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg">
                    {mod.role}
                  </span>
                </td>
                <td className="px-8 py-5">
                  <div className="flex items-center gap-2 text-[10px] font-medium text-gray-400 uppercase tracking-tighter">
                    <Clock size={12} /> {mod.lastActive}
                  </div>
                </td>
                <td className="px-8 py-5">
                  <span
                    className={`text-[9px] font-bold uppercase px-2.5 py-1 rounded-lg ${mod.status === "Active" ? "bg-green-50 text-green-500" : "bg-gray-100 text-gray-400"}`}
                  >
                    {mod.status}
                  </span>
                </td>
                <td className="px-8 py-5 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => openModal(mod)}
                      className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:bg-[#003366] hover:text-white transition-all shadow-sm"
                      title="Edit Moderator"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(mod.id, mod.status)}
                      className={`p-2.5 rounded-xl transition-all shadow-sm ${mod.status === "Active" ? "bg-red-50 text-red-400 hover:bg-red-500 hover:text-white" : "bg-green-50 text-green-500 hover:bg-green-500 hover:text-white"}`}
                      title={
                        mod.status === "Active" ? "Deactivate" : "Activate"
                      }
                    >
                      {mod.status === "Active" ? (
                        <UserX size={14} />
                      ) : (
                        <UserCheck size={14} />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- ADD/EDIT MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#003366]/40 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          ></div>
          <div className="relative w-full max-w-md bg-white rounded-[40px] shadow-2xl animate-in zoom-in duration-200 overflow-hidden">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-sm font-bold text-[#003366]">
                {editingMod ? "Edit Moderator" : "Add New Moderator"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-gray-300 hover:bg-gray-50 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-8 space-y-5">
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-gray-500">
                  Full Name
                </label>
                <input
                  required
                  type="text"
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 text-xs font-semibold text-[#003366] outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-gray-500">
                  Email Address
                </label>
                <input
                  required
                  type="email"
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 text-xs font-semibold text-[#003366] outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-gray-500">
                  System Role
                </label>
                <select
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 text-xs font-semibold text-[#003366] outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                >
                  <option>Content Moderator</option>
                  <option>Support Lead</option>
                  <option>Verification Officer</option>
                </select>
              </div>
              <button className="w-full py-4 bg-[#003366] text-white rounded-2xl font-bold text-xs uppercase tracking-widest mt-4 shadow-xl hover:bg-[#002244] transition-all">
                {editingMod ? "Update Moderator" : "Invite Moderator"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
