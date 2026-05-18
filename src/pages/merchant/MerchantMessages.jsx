import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCheck,
  Image as ImageIcon,
  Info,
  MoreVertical,
  Search,
  Send,
  Smile,
} from "lucide-react";

export default function MerchantMessages() {
  const [threads, setThreads] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");
  const [imageData, setImageData] = useState("");
  const messagesRef = useRef(null);
  const imageInputRef = useRef(null);
  const isAtBottomRef = useRef(true);

  const activeChat = useMemo(
    () => threads.find((thread) => thread.id === activeChatId) || threads[0] || null,
    [activeChatId, threads],
  );

  const showNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2500);
  };

  const loadThreads = async ({ keepActive = false } = {}) => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch("/api/merchant_messages.php", {
        credentials: "include",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Unable to load messages.");
      }

      const nextThreads = Array.isArray(payload.threads) ? payload.threads : [];
      setThreads(nextThreads);
      setActiveChatId((current) => {
        if (keepActive && current && nextThreads.some((thread) => thread.id === current)) {
          return current;
        }
        return nextThreads[0]?.id || null;
      });
    } catch (loadError) {
      setThreads([]);
      setError(loadError.message || "Unable to load messages.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadThreads();
  }, []);

  const scrollMessagesToBottom = () => {
    const container = messagesRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  };

  const handleMessagesScroll = () => {
    const container = messagesRef.current;
    if (!container) return;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    isAtBottomRef.current = distanceFromBottom <= 12;
  };

  useEffect(() => {
    isAtBottomRef.current = true;
    requestAnimationFrame(scrollMessagesToBottom);
  }, [activeChat?.id]);

  useEffect(() => {
    if (isAtBottomRef.current) {
      requestAnimationFrame(scrollMessagesToBottom);
    }
  }, [activeChat?.messages.length]);

  const handleSend = async () => {
    const message = messageText.trim();
    if ((!message && !imageData) || !activeChat || sending) {
      return;
    }

    setSending(true);
    try {
      const response = await fetch("/api/merchant_messages.php", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: Number(activeChat.id),
          message,
          imageData,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Unable to send message.");
      }

      setMessageText("");
      setImageData("");
      await loadThreads({ keepActive: true });
    } catch (sendError) {
      showNotice(sendError.message);
    } finally {
      setSending(false);
    }
  };

  const handleImageSelect = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showNotice("Messages only allow image files.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showNotice("Message image must be 5MB or smaller.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setImageData(String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex h-[calc(100vh-40px)] bg-white overflow-hidden font-sans">
      {notice ? (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#003366] text-white px-5 py-2 rounded-md text-xs font-bold">
          {notice}
        </div>
      ) : null}

      <div className="w-[350px] border-r border-gray-100 flex flex-col bg-[#F9FAFB]">
        <div className="p-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search conversations..."
              disabled
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-100 rounded-lg text-sm text-gray-400 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="h-full flex items-center justify-center px-6 text-center">
              <p className="text-[12px] text-gray-400 font-medium">
                Loading conversations...
              </p>
            </div>
          ) : threads.length > 0 ? (
            threads.map((chat) => (
              <button
                key={chat.id}
                onClick={() => setActiveChatId(chat.id)}
                className={`relative flex items-center p-4 cursor-pointer transition-colors w-full text-left ${
                  activeChat?.id === chat.id ? "bg-white" : "hover:bg-gray-50"
                }`}
              >
                {activeChat?.id === chat.id ? (
                  <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-[#FF851B]"></div>
                ) : null}

                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-full bg-[#D1E9F6] flex items-center justify-center text-[#003366] font-bold border-2 border-white shadow-sm">
                    {chat.avatar || "CU"}
                  </div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white bg-green-500"></div>
                </div>

                <div className="ml-3 flex-1 overflow-hidden">
                  <div className="flex justify-between items-center gap-2">
                    <h3 className="text-[14px] font-bold text-[#001F3F] truncate">
                      {chat.name}
                    </h3>
                    <span className="text-[11px] text-gray-400 shrink-0">
                      {chat.time}
                    </span>
                  </div>
                  <p className="text-[12px] text-gray-500 truncate mt-1">
                    {chat.lastMsg || "No messages yet."}
                  </p>
                </div>
              </button>
            ))
          ) : (
            <div className="h-full flex items-center justify-center px-6 text-center">
              <div>
                <AlertCircle size={22} className="mx-auto mb-3 text-gray-300" />
                <p className="text-[12px] text-gray-400 font-medium">
                  {error || "No customer conversations yet."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-white">
        {activeChat ? (
          <>
            <div className="h-[70px] border-b border-gray-100 flex items-center justify-between px-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#D1E9F6] flex items-center justify-center text-[#003366] font-bold">
                  {activeChat.avatar || "CU"}
                </div>
                <div>
                  <h2 className="text-[15px] font-bold text-[#001F3F]">
                    {activeChat.name}
                  </h2>
                  <span className="text-[11px] font-bold text-green-500 tracking-wider">
                    CUSTOMER
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-6 text-gray-400">
                <Info size={20} className="cursor-pointer hover:text-gray-600" />
                <MoreVertical
                  size={20}
                  className="cursor-pointer hover:text-gray-600"
                />
              </div>
            </div>

            <div
              ref={messagesRef}
              onScroll={handleMessagesScroll}
              className="flex-1 overflow-y-auto p-10 space-y-8 bg-[#FBFCFE]"
            >
              {activeChat.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.sender === "me" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`max-w-[500px] p-4 rounded-2xl shadow-sm ${
                      msg.sender === "me"
                        ? "bg-[#003366] text-white rounded-tr-none"
                        : "bg-white border border-gray-100 text-[#333] rounded-tl-none"
                    }`}
                  >
                    <p className="text-[14px] leading-relaxed whitespace-pre-line">
                      {msg.text}
                    </p>
                    {msg.imageUrl ? (
                      <a href={msg.imageUrl} target="_blank" rel="noreferrer">
                        <img
                          src={msg.imageUrl}
                          alt="Message attachment"
                          className={`${msg.text ? "mt-3" : ""} max-h-80 rounded-xl object-contain`}
                        />
                      </a>
                    ) : null}
                  </div>
                  <div
                    className={`flex items-center gap-1 mt-2 text-[11px] text-gray-400 font-medium ${
                      msg.sender === "me" ? "mr-1" : "ml-1"
                    }`}
                  >
                    {msg.time}
                    {msg.sender === "me" ? (
                      <CheckCheck size={14} className="text-blue-400" />
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-gray-100">
              <div className="flex items-center gap-4 bg-[#F8F9FB] rounded-2xl px-5 py-2 border border-gray-100">
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="text-gray-300 hover:text-[#0074D9] transition-colors"
                  title="Attach image"
                >
                  <ImageIcon size={20} />
                </button>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleImageSelect}
                  className="hidden"
                />

                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      handleSend();
                    }
                  }}
                  placeholder="Write your message here..."
                  className="flex-1 bg-transparent border-none focus:ring-0 text-[14px] text-gray-700 placeholder-gray-400 outline-none"
                />

                <Smile size={22} className="text-gray-300" />

                <button
                  onClick={handleSend}
                  disabled={sending || (messageText.trim() === "" && imageData === "")}
                  className="bg-[#FF851B] p-2.5 rounded-xl text-white shadow-lg hover:bg-[#E67716] transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={18} fill="white" />
                </button>
              </div>
              {imageData ? (
                <div className="mt-3 flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
                  <img src={imageData} alt="Selected attachment" className="h-16 w-16 rounded-lg object-cover" />
                  <p className="flex-1 text-[11px] font-bold text-gray-500">Image ready to send</p>
                  <button
                    type="button"
                    onClick={() => setImageData("")}
                    className="text-xs font-bold text-red-500"
                  >
                    Remove
                  </button>
                </div>
              ) : null}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-[#FBFCFE] p-8">
            <div className="max-w-sm text-center">
              <AlertCircle size={30} className="mx-auto mb-3 text-gray-300" />
              <h2 className="text-sm font-bold text-[#003366]">
                No conversation selected
              </h2>
              <p className="text-xs text-gray-500 mt-2">
                Customer inquiries will appear here once buyers message your shop.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
