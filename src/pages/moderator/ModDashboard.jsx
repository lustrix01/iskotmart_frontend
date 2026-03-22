import React from "react";
import {
  ShieldAlert,
  MessageSquare,
  UserX,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowUpRight,
  MoreVertical,
} from "lucide-react";

export default function ModDashboard() {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* --- TOP METRICS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active reports"
          value="12"
          icon={<ShieldAlert size={20} />}
          trend="+2 new"
          color="text-red-500"
        />
        <StatCard
          title="Flagged reviews"
          value="48"
          icon={<MessageSquare size={20} />}
          trend="Requires review"
          color="text-[#FF851B]"
        />
        <StatCard
          title="Pending bans"
          value="3"
          icon={<UserX size={20} />}
          trend="High priority"
          color="text-blue-500"
        />
        <StatCard
          title="Resolved cases"
          value="156"
          icon={<CheckCircle size={20} />}
          trend="This month"
          color="text-green-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* --- LEFT COLUMN: URGENT REPORTS QUEUE --- */}
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-50 flex justify-between items-center">
            <h3 className="text-sm font-bold text-[#003366]">Urgent reports</h3>
            <button className="text-[10px] font-bold text-[#FF851B] uppercase hover:underline">
              View all
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            <ReportItem
              user="Juan_D"
              reason="Hate Speech"
              product="iPhone 15 Case"
              time="2m ago"
            />
            <ReportItem
              user="Student_99"
              reason="Spam Link"
              product="N/A (Review)"
              time="15m ago"
            />
            <ReportItem
              user="Merchant_X"
              reason="Fake Product"
              product="Nike Air Max"
              time="1h ago"
            />
            <ReportItem
              user="Maria_S"
              reason="Harassment"
              product="N/A (Message)"
              time="3h ago"
            />
          </div>
        </div>

        {/* --- RIGHT COLUMN: RECENT MODERATION ACTIONS --- */}
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-50 flex justify-between items-center">
            <h3 className="text-sm font-bold text-[#003366]">Recent actions</h3>
            <Clock size={16} className="text-gray-300" />
          </div>
          <div className="p-6 space-y-6">
            <ActionRow
              action="Banned user"
              target="Spammer_01"
              date="Mar 22, 2026"
              status="Permanent"
            />
            <ActionRow
              action="Removed listing"
              target="Fake Airpods"
              date="Mar 22, 2026"
              status="Flagged"
            />
            <ActionRow
              action="Kept review"
              target="REV-9921"
              date="Mar 21, 2026"
              status="Verified"
            />
            <ActionRow
              action="Suspended shop"
              target="Tech_Scams"
              date="Mar 21, 2026"
              status="7 Days"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function StatCard({ title, value, icon, trend, color }) {
  return (
    <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm transition-all hover:shadow-md">
      <div className="flex justify-between items-start mb-4">
        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
          {icon}
        </div>
        <span className={`text-[10px] font-bold ${color}`}>{trend}</span>
      </div>
      <div>
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider leading-none">
          {title}
        </p>
        <h4 className="text-3xl font-bold text-[#003366] mt-2">{value}</h4>
      </div>
    </div>
  );
}

function ReportItem({ user, reason, product, time }) {
  return (
    <div className="p-5 flex items-center justify-between group hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500">
          <AlertCircle size={18} />
        </div>
        <div>
          <p className="text-xs font-bold text-[#003366]">{reason}</p>
          <p className="text-[10px] text-gray-400 font-medium tracking-tight">
            By {user} • {product}
          </p>
        </div>
      </div>
      <div className="text-right flex items-center gap-3">
        <span className="text-[10px] font-medium text-gray-300">{time}</span>
        <button className="p-2 text-gray-300 hover:text-[#003366]">
          <ArrowUpRight size={16} />
        </button>
      </div>
    </div>
  );
}

function ActionRow({ action, target, date, status }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-1.5 rounded-full bg-[#FF851B]"></div>
        <div>
          <p className="text-xs font-semibold text-[#003366]">
            {action}:{" "}
            <span className="text-gray-400 font-normal">{target}</span>
          </p>
          <p className="text-[10px] text-gray-300 font-medium">{date}</p>
        </div>
      </div>
      <span className="text-[9px] font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded-md uppercase tracking-tighter">
        {status}
      </span>
    </div>
  );
}
