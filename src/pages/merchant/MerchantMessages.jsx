import React, { useState } from "react";
import {
  Search,
  Phone,
  Info,
  MoreVertical,
  Paperclip,
  Image as ImageIcon,
  Smile,
  Send,
  CheckCheck,
} from "lucide-react";

export default function MerchantMessages() {
  const [activeChat, setActiveChat] = useState(0);
  const [messageText, setMessageText] = useState("");

  const chats = [
    {
      id: 1,
      name: "TechHub Electronics",
      lastMsg: "Is the keyboard still available for meetup?",
      time: "2:45 PM",
      status: "ONLINE",
      avatar: "TE",
    },
    {
      id: 2,
      name: "Elite Graphics",
      lastMsg: "I've sent the first draft of the logo.",
      time: "Yesterday",
      status: "OFFLINE",
      avatar: "EG",
    },
    {
      id: 3,
      name: "Student Snacks",
      lastMsg: "Your cookies are ready for pickup!",
      time: "Mar 20",
      status: "ONLINE",
      avatar: "SS",
    },
  ];

  const messages = [
    {
      id: 1,
      text: "Hello! Is the Mechanical Keyboard still available?",
      time: "2:40 PM",
      sender: "me",
    },
    {
      id: 2,
      text: "Yes, it is! We still have 2 units in stock.",
      time: "2:42 PM",
      sender: "them",
    },
    {
      id: 3,
      text: "Great. Can we do a meetup at the Student Lounge tomorrow?",
      time: "2:44 PM",
      sender: "me",
    },
    {
      id: 4,
      text: "Sure! What time works for you?",
      time: "2:45 PM",
      sender: "them",
    },
  ];

  return (
    <div className="flex h-[calc(100vh-40px)] bg-white overflow-hidden font-sans">
      {/* --- LEFT SIDEBAR --- */}
      <div className="w-[350px] border-r border-gray-100 flex flex-col bg-[#F9FAFB]">
        {/* Search Header */}
        <div className="p-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-200"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {chats.map((chat, index) => (
            <div
              key={chat.id}
              onClick={() => setActiveChat(index)}
              className={`relative flex items-center p-4 cursor-pointer transition-colors ${
                activeChat === index ? "bg-white" : "hover:bg-gray-50"
              }`}
            >
              {/* Active Indicator Bar */}
              {activeChat === index && (
                <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-[#FF851B]"></div>
              )}

              {/* Avatar */}
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-[#D1E9F6] flex items-center justify-center text-[#003366] font-bold border-2 border-white shadow-sm">
                  {chat.avatar}
                </div>
                <div
                  className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${chat.status === "ONLINE" ? "bg-green-500" : "bg-gray-300"}`}
                ></div>
              </div>

              {/* Text Info */}
              <div className="ml-3 flex-1 overflow-hidden">
                <div className="flex justify-between items-center">
                  <h3 className="text-[14px] font-bold text-[#001F3F] truncate">
                    {chat.name}
                  </h3>
                  <span className="text-[11px] text-gray-400">{chat.time}</span>
                </div>
                <p className="text-[12px] text-gray-500 truncate mt-1">
                  {chat.lastMsg}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- RIGHT CHAT WINDOW --- */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Header */}
        <div className="h-[70px] border-b border-gray-100 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#D1E9F6] flex items-center justify-center text-[#003366] font-bold">
              {chats[activeChat].avatar}
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-[#001F3F]">
                {chats[activeChat].name}
              </h2>
              <span className="text-[11px] font-bold text-green-500 tracking-wider">
                ONLINE
              </span>
            </div>
          </div>
          <div className="flex items-center gap-6 text-gray-400">
            <Phone size={20} className="cursor-pointer hover:text-gray-600" />
            <Info size={20} className="cursor-pointer hover:text-gray-600" />
            <MoreVertical
              size={20}
              className="cursor-pointer hover:text-gray-600"
            />
          </div>
        </div>

        {/* Messages Content */}
        <div className="flex-1 overflow-y-auto p-10 space-y-8 bg-[#FBFCFE]">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === "me" ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[500px] p-4 rounded-2xl shadow-sm ${
                  msg.sender === "me"
                    ? "bg-[#003366] text-white rounded-tr-none"
                    : "bg-white border border-gray-100 text-[#333] rounded-tl-none"
                }`}
              >
                <p className="text-[14px] leading-relaxed">{msg.text}</p>
              </div>
              <div
                className={`flex items-center gap-1 mt-2 text-[11px] text-gray-400 font-medium ${msg.sender === "me" ? "mr-1" : "ml-1"}`}
              >
                {msg.time}
                {msg.sender === "me" && (
                  <CheckCheck size={14} className="text-blue-400" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Input */}
        <div className="p-6 border-t border-gray-100">
          <div className="flex items-center gap-4 bg-[#F8F9FB] rounded-2xl px-5 py-2 border border-gray-100">
            <Paperclip
              size={20}
              className="text-gray-400 cursor-pointer hover:text-gray-600"
            />
            <ImageIcon
              size={20}
              className="text-gray-400 cursor-pointer hover:text-gray-600"
            />

            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Write your message here..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-[14px] text-gray-700 placeholder-gray-400 outline-none"
            />

            <Smile
              size={22}
              className="text-gray-300 cursor-pointer hover:text-gray-500"
            />

            <button className="bg-[#FF851B] p-2.5 rounded-xl text-white shadow-lg hover:bg-[#E67716] transition-all transform active:scale-95">
              <Send size={18} fill="white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
