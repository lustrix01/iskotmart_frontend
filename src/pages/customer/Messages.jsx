import React, { useState } from "react";
import {
  Send,
  Phone,
  Info,
  Search,
  MoreVertical,
  User,
  CheckCheck,
  ImageIcon,
  Paperclip,
  Bell,
  Smile,
  MessageSquare,
  Trash2,
  Archive,
  AlertCircle,
} from "lucide-react";

export default function Messages() {
  const [activeChat, setActiveChat] = useState(0);
  const [modal, setModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    action: "",
  });

  const handleAction = (title, message, action) => {
    setModal({ isOpen: true, title, message, action });
  };

  const closeModal = () => setModal({ ...modal, isOpen: false });

  const chats = [
    {
      id: 0,
      name: "TechHub Electronics",
      lastMsg: "Is the keyboard still available for meetup?",
      time: "2:45 PM",
      online: true,
      avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=Tech",
      messages: [
        {
          sender: "me",
          text: "Hello! Is the Mechanical Keyboard still available?",
          time: "2:40 PM",
        },
        {
          sender: "them",
          text: "Yes, it is! We still have 2 units in stock.",
          time: "2:42 PM",
        },
        {
          sender: "me",
          text: "Great. Can we do a meetup at the Student Lounge tomorrow?",
          time: "2:44 PM",
        },
        {
          sender: "them",
          text: "Sure! What time works for you?",
          time: "2:45 PM",
        },
      ],
    },
    {
      id: 1,
      name: "Elite Graphics",
      lastMsg: "I've sent the first draft of the logo.",
      time: "Yesterday",
      online: false,
      avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=Elite",
      messages: [],
    },
    {
      id: 2,
      name: "Student Snacks",
      lastMsg: "Your cookies are ready for pickup!",
      time: "Mar 20",
      online: true,
      avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=Snack",
      messages: [],
    },
  ];

  return (
    // Maximize height based on screen size minus Navbar/Padding
    <div className="max-w-full mx-auto animate-in fade-in duration-500 h-[calc(100vh-140px)] flex flex-col">
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden flex flex-grow h-full">
        {/* LEFT SIDEBAR: Clickable Chat List */}
        <div className="w-80 border-r border-gray-100 flex flex-col bg-gray-50/10 shrink-0">
          <div className="p-4 border-b border-gray-50 bg-white">
            <div className="relative group">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#003366] transition-colors"
                size={14}
              />
              <input
                type="text"
                placeholder="Search conversations..."
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs focus:outline-none focus:border-[#003366] focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="flex-grow overflow-y-auto no-scrollbar">
            {chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => setActiveChat(chat.id)}
                className={`w-full p-4 flex gap-3 items-center border-b border-gray-50 transition-all relative group ${
                  activeChat === chat.id ? "bg-white" : "hover:bg-white/80"
                }`}
              >
                {activeChat === chat.id && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FF851B]"></div>
                )}

                <div className="relative shrink-0 transition-transform group-hover:scale-105">
                  <div className="w-10 h-10 rounded-full bg-blue-50 overflow-hidden border border-gray-100">
                    <img
                      src={chat.avatar}
                      alt="avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {chat.online && (
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>

                <div className="flex-grow min-w-0 text-left">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h4
                      className={`text-xs font-bold truncate ${activeChat === chat.id ? "text-[#003366]" : "text-gray-700"}`}
                    >
                      {chat.name}
                    </h4>
                    <span className="text-[9px] text-gray-400 font-medium">
                      {chat.time}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 truncate font-medium">
                    {chat.lastMsg}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT AREA: Active Chat Window */}
        <div className="flex-grow flex flex-col bg-white">
          {/* Header Area: All elements clickable */}
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white shadow-sm z-10">
            <button
              onClick={() =>
                handleAction(
                  "Merchant Profile",
                  "Viewing shop credentials...",
                  "Opening Merchant_ID profile summary for " +
                    chats[activeChat].name,
                )
              }
              className="flex items-center gap-3 group text-left"
            >
              <div className="w-10 h-10 rounded-full bg-blue-50 overflow-hidden border border-gray-100 group-hover:border-[#FF851B] transition-colors">
                <img
                  src={chats[activeChat].avatar}
                  alt="active"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-800 group-hover:text-[#003366] transition-colors">
                  {chats[activeChat].name}
                </h3>
                <p className="text-[10px] text-green-500 font-bold uppercase tracking-wider">
                  Online
                </p>
              </div>
            </button>

            <div className="flex items-center gap-1">
              <button
                onClick={() =>
                  handleAction(
                    "Voice Call",
                    "Initializing VoIP...",
                    "Requesting audio stream permission for session_id",
                  )
                }
                className="p-2.5 text-gray-400 hover:text-[#003366] hover:bg-gray-50 rounded-full transition-all"
              >
                <Phone size={18} />
              </button>
              <button
                onClick={() =>
                  handleAction(
                    "Store Details",
                    "Fetching merchant metadata...",
                    "Opening shop_config and rating_history",
                  )
                }
                className="p-2.5 text-gray-400 hover:text-[#003366] hover:bg-gray-50 rounded-full transition-all"
              >
                <Info size={18} />
              </button>
              <button
                onClick={() =>
                  handleAction(
                    "Options",
                    "Loading chat settings...",
                    "Displaying conversation_actions_menu",
                  )
                }
                className="p-2.5 text-gray-400 hover:text-[#003366] hover:bg-gray-50 rounded-full transition-all"
              >
                <MoreVertical size={18} />
              </button>
            </div>
          </div>

          {/* Messages History: Maximized space */}
          <div className="flex-grow overflow-y-auto p-8 space-y-6 bg-[#F8FAFC]/30 no-scrollbar">
            {chats[activeChat].messages.length > 0 ? (
              chats[activeChat].messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-2 duration-300`}
                >
                  <div className={`max-w-[65%] space-y-1`}>
                    <div
                      className={`px-4 py-3 rounded-2xl text-xs font-medium shadow-sm leading-relaxed ${
                        msg.sender === "me"
                          ? "bg-[#003366] text-white rounded-tr-none"
                          : "bg-white text-gray-700 border border-gray-100 rounded-tl-none"
                      }`}
                    >
                      {msg.text}
                    </div>
                    <div
                      className={`flex items-center gap-1.5 text-[9px] text-gray-400 font-bold ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
                    >
                      {msg.time}
                      {msg.sender === "me" && (
                        <CheckCheck size={11} className="text-[#0074D9]" />
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-40">
                <MessageSquare size={48} className="text-gray-200 mb-2" />
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
                  No conversation history
                </p>
              </div>
            )}
          </div>

          {/* Message Input: All utility icons clickable */}
          <div className="p-5 border-t border-gray-100 bg-white">
            <div className="flex items-center gap-3 bg-[#F8FAFC] border border-gray-100 rounded-2xl px-5 py-2.5 focus-within:border-[#003366] focus-within:bg-white focus-within:shadow-md transition-all">
              <button
                onClick={() =>
                  handleAction(
                    "Attachments",
                    "Opening file explorer...",
                    "Accessing local_storage to append binary_data",
                  )
                }
                className="text-gray-300 hover:text-[#003366] transition-colors"
              >
                <Paperclip size={18} />
              </button>
              <button
                onClick={() =>
                  handleAction(
                    "Gallery",
                    "Accessing photos...",
                    "Opening image_picker to select media_payload",
                  )
                }
                className="text-gray-300 hover:text-[#003366] transition-colors"
              >
                <ImageIcon size={18} />
              </button>

              <input
                type="text"
                placeholder="Write your message here..."
                className="flex-grow bg-transparent border-none text-xs focus:outline-none py-2 font-medium text-gray-700"
              />

              <button
                onClick={() =>
                  handleAction(
                    "Emojis",
                    "Loading keyboard...",
                    "Displaying emoji_picker panel",
                  )
                }
                className="text-gray-300 hover:text-[#FF851B] transition-colors"
              >
                <Smile size={18} />
              </button>

              <button
                onClick={() =>
                  handleAction(
                    "Send Message",
                    "Encrypting payload...",
                    "Pushing message string to merchant_socket via IskoMart Realtime Hub",
                  )
                }
                className="bg-[#FF851B] text-white p-2.5 rounded-xl shadow-lg hover:bg-[#E67616] hover:-translate-y-0.5 transition-all active:scale-90"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- CUSTOM SIMULATION POPUP --- */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#003366]/20 backdrop-blur-sm animate-in fade-in"
            onClick={closeModal}
          ></div>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm relative z-10 overflow-hidden animate-in zoom-in duration-300 border border-gray-100">
            <div className="p-8 text-center">
              <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={28} className="text-[#0074D9]" />
              </div>
              <h3 className="text-lg font-bold text-[#003366] mb-1">
                {modal.title}
              </h3>
              <p className="text-gray-400 text-[11px] mb-6 leading-relaxed">
                {modal.message}
              </p>

              <div className="bg-[#F8FAFC] rounded-xl p-4 mb-6 border border-gray-100 text-left">
                <div className="flex items-center gap-2 mb-1.5 opacity-40 text-[#003366]">
                  <span className="text-[9px] font-bold tracking-widest uppercase">
                    Action taken
                  </span>
                </div>
                <p className="text-[10px] font-medium text-[#003366] leading-relaxed">
                  {modal.action}
                </p>
              </div>

              <button
                onClick={closeModal}
                className="w-full bg-[#003366] text-white py-3.5 rounded-xl font-bold text-xs shadow-md hover:bg-[#002244] transition-all active:scale-95"
              >
                Continue
              </button>
            </div>
            <div className="h-1 bg-gradient-to-r from-[#0074D9] to-[#FF851B] w-full"></div>
          </div>
        </div>
      )}
    </div>
  );
}
