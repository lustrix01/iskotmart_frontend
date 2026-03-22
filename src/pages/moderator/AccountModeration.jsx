import React, { useState, useMemo } from "react";
import {
  Search,
  UserX,
  ShieldAlert,
  Ban,
  Clock,
  Filter,
  CheckCircle,
  X,
} from "lucide-react";

export default function AccountModeration() {
  const [searchTerm, setSearchTerm] = useState("");
  const [notification, setNotification] = useState(null);
  const [users, setUsers] = useState([
    {
      id: "USR-001",
      name: "Juan Dela Cruz",
      email: "juan@example.com",
      status: "Active",
      reports: 0,
      joined: "Jan 12, 2026",
    },
    {
      id: "USR-002",
      name: "Spammer_Bot",
      email: "bot@spam.com",
      status: "Flagged",
      reports: 12,
      joined: "Mar 01, 2026",
    },
    {
      id: "USR-003",
      name: "Maria Clara",
      email: "maria@test.com",
      status: "Suspended",
      reports: 2,
      joined: "Feb 20, 2026",
    },
    {
      id: "USR-004",
      name: "Isko_User_99",
      email: "student@puper.edu",
      status: "Active",
      reports: 1,
      joined: "Mar 15, 2026",
    },
  ]);

  // --- HANDLERS ---
  const triggerToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const updateUserStatus = (id, newStatus) => {
    const user = users.find((u) => u.id === id);
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: newStatus } : u)),
    );
    triggerToast(`${user.name} status updated to ${newStatus}`);
  };

  const filteredUsers = useMemo(() => {
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.id.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [users, searchTerm]);

  return (
    <div className="space-y-6 animate-in fade-in duration-700 relative">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-24 right-10 z-[200] bg-[#003366] text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right">
          <CheckCircle size={16} className="text-green-400" />
          <span className="text-xs font-bold">{notification}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-grow max-w-md">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            size={16}
          />
          <input
            type="text"
            placeholder="Search user by name or ID..."
            className="pl-11 pr-6 py-3 bg-white border border-gray-100 rounded-2xl text-xs font-semibold text-[#003366] outline-none shadow-sm focus:ring-2 focus:ring-blue-50 w-full transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            <tr>
              <th className="px-8 py-5">User info</th>
              <th className="px-8 py-5">Status</th>
              <th className="px-8 py-5 text-center">Reports</th>
              <th className="px-8 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredUsers.map((user) => (
              <tr
                key={user.id}
                className="hover:bg-gray-50/50 transition-colors group"
              >
                <td className="px-8 py-6">
                  <p className="text-xs font-bold text-[#003366]">
                    {user.name}
                  </p>
                  <p className="text-[10px] text-gray-400 font-medium">
                    {user.id}
                  </p>
                </td>
                <td className="px-8 py-6">
                  <span
                    className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase ${
                      user.status === "Active"
                        ? "bg-green-50 text-green-600"
                        : user.status === "Flagged"
                          ? "bg-orange-50 text-orange-600"
                          : "bg-red-50 text-red-600"
                    }`}
                  >
                    {user.status}
                  </span>
                </td>
                <td className="px-8 py-6 text-center text-xs font-bold text-gray-400">
                  {user.reports}
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => updateUserStatus(user.id, "Flagged")}
                      className="p-2.5 bg-orange-50 text-orange-500 hover:bg-orange-500 hover:text-white rounded-xl transition-all shadow-sm"
                      title="Flag Account"
                    >
                      <ShieldAlert size={16} />
                    </button>
                    <button
                      onClick={() => updateUserStatus(user.id, "Suspended")}
                      className="p-2.5 bg-blue-50 text-blue-500 hover:bg-blue-500 hover:text-white rounded-xl transition-all shadow-sm"
                      title="Suspend Account"
                    >
                      <Clock size={16} />
                    </button>
                    <button
                      onClick={() => updateUserStatus(user.id, "Banned")}
                      className="p-2.5 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-sm"
                      title="Permanently Ban"
                    >
                      <Ban size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
