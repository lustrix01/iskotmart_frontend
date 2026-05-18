import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  AlertCircle,
  CheckCheck,
  Image as ImageIcon,
  MessageSquare,
  Search,
  Send,
  Smile,
} from "lucide-react";

export default function Messages() {
  const location = useLocation();
  const requestedMerchantId = Number(location.state?.merchantId || 0);
  const [threads, setThreads] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");
  const [imageData, setImageData] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesRef = useRef(null);
  const imageInputRef = useRef(null);
  const isAtBottomRef = useRef(true);

  const activeThread = useMemo(
    () => threads.find((thread) => thread.id === activeThreadId) || threads[0] || null,
    [activeThreadId, threads],
  );
  const filteredThreads = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return threads;
    }
    return threads.filter((thread) =>
      [thread.name, thread.lastMsg]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [searchQuery, threads]);

  const showNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2500);
  };

  const loadThreads = useCallback(async ({ keepActive = false } = {}) => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch("/api/customer_messages.php", {
        credentials: "include",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Unable to load messages.");
      }

      const nextThreads = Array.isArray(payload.threads) ? payload.threads : [];
      setThreads(nextThreads);
      setActiveThreadId((current) => {
        if (keepActive && current && nextThreads.some((thread) => thread.id === current)) {
          return current;
        }
        if (requestedMerchantId && nextThreads.some((thread) => thread.id === requestedMerchantId)) {
          return requestedMerchantId;
        }
        return current || nextThreads[0]?.id || null;
      });
    } catch (fetchError) {
      setThreads([]);
      setError(fetchError.message || "Unable to load messages.");
    } finally {
      setLoading(false);
    }
  }, [requestedMerchantId]);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

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
  }, [activeThread?.id]);

  useEffect(() => {
    if (isAtBottomRef.current) {
      requestAnimationFrame(scrollMessagesToBottom);
    }
  }, [activeThread?.messages.length]);

  const handleSend = async () => {
    const message = messageText.trim();
    if ((!message && !imageData) || !activeThread || sending) {
      return;
    }

    setSending(true);
    try {
      const response = await fetch("/api/customer_messages.php", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchantId: Number(activeThread.id),
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
    <div className="max-w-full mx-auto animate-in fade-in duration-500 h-[calc(100vh-140px)] flex flex-col">
      {notice ? (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#003366] text-white px-5 py-2 rounded-md text-xs font-bold">
          {notice}
        </div>
      ) : null}

      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden flex flex-grow h-full">
        <div className="w-80 border-r border-gray-100 flex flex-col bg-gray-50/10 shrink-0">
          <div className="p-4 border-b border-gray-50 bg-white">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300"
                size={14}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs text-gray-600 outline-none focus:border-[#0074D9]"
              />
            </div>
          </div>

          <div className="flex-grow overflow-y-auto">
            {loading ? (
              <div className="h-full flex items-center justify-center px-6 text-center">
                <p className="text-[11px] font-medium text-gray-400">
                  Loading conversations...
                </p>
              </div>
            ) : filteredThreads.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {filteredThreads.map((thread) => (
                  <button
                    key={thread.id}
                    onClick={() => setActiveThreadId(thread.id)}
                    className={`w-full p-4 text-left transition-colors ${
                      activeThread?.id === thread.id ? "bg-white" : "hover:bg-white/70"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-bold text-[#003366] truncate">
                        {thread.name}
                      </p>
                      <span className="text-[9px] text-gray-400 shrink-0">
                        {thread.time}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-gray-400 truncate">
                      {thread.lastMsg || "No messages yet."}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center px-6 text-center">
                <p className="text-[11px] font-medium text-gray-400">
                  {threads.length > 0 ? "No conversations match your search." : "No conversations yet."}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex-grow bg-[#F8FAFC]/30 flex flex-col min-w-0">
          {activeThread ? (
            <>
              <div className="px-8 py-5 bg-white border-b border-gray-100">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Conversation with
                </p>
                <h2 className="text-lg font-bold text-[#003366]">
                  {activeThread.name}
                </h2>
              </div>

              <div
                ref={messagesRef}
                onScroll={handleMessagesScroll}
                className="flex-1 overflow-y-auto p-8 space-y-4"
              >
                {activeThread.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex flex-col ${
                      message.sender === "me" ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
                        message.sender === "me"
                          ? "bg-[#003366] text-white rounded-br-sm"
                          : "bg-white border border-gray-100 text-gray-700 rounded-bl-sm"
                      }`}
                    >
                      <p className="text-xs leading-relaxed whitespace-pre-line">
                        {message.text}
                      </p>
                      {message.imageUrl ? (
                        <a href={message.imageUrl} target="_blank" rel="noreferrer">
                          <img
                            src={message.imageUrl}
                            alt="Message attachment"
                            className={`${message.text ? "mt-3" : ""} max-h-72 rounded-xl object-contain`}
                          />
                        </a>
                      ) : null}
                      <p
                        className={`mt-2 text-[9px] ${
                          message.sender === "me" ? "text-white/60 text-right" : "text-gray-400"
                        }`}
                      >
                        {message.time}
                      </p>
                    </div>
                    {message.sender === "me" ? (
                      <div className="flex items-center gap-1 mt-1 mr-1 text-[10px] text-gray-400">
                        Sent <CheckCheck size={12} className="text-blue-400" />
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>

              <div className="p-5 border-t border-gray-100 bg-white">
                <div className="flex items-center gap-4 bg-[#F8F9FB] rounded-2xl px-5 py-2 border border-gray-100">
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="text-gray-300 hover:text-[#0074D9] transition-colors"
                    title="Attach image"
                  >
                    <ImageIcon size={18} />
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
                    onChange={(event) => setMessageText(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        handleSend();
                      }
                    }}
                    placeholder="Write your message here..."
                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-gray-700 placeholder-gray-400 outline-none"
                  />

                  <Smile size={20} className="text-gray-300" />

                  <button
                    onClick={handleSend}
                    disabled={sending || (messageText.trim() === "" && imageData === "")}
                    className="bg-[#FF851B] p-2.5 rounded-xl text-white shadow-lg hover:bg-[#E67716] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={17} fill="white" />
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
            <div className="h-full flex items-center justify-center">
              <div className="max-w-md text-center">
                {error ? (
                  <AlertCircle size={28} className="mx-auto mb-4 text-red-400" />
                ) : (
                  <div className="w-14 h-14 mx-auto rounded-full bg-white border border-gray-100 flex items-center justify-center mb-4 shadow-sm">
                    <MessageSquare size={24} className="text-[#003366]" />
                  </div>
                )}
                <h2 className="text-sm font-bold text-[#003366]">
                  No messages available
                </h2>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                  {error || "Your customer-to-merchant conversations will appear here."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
