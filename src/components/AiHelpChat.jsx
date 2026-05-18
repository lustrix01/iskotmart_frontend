import { useMemo, useRef, useState } from "react";
import { Bot, Loader2, LogIn, MessageCircle, Send, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";

const STARTER_MESSAGE = {
  role: "assistant",
  content:
    "I can help you compare listed products and services, prices, active item discounts, reviews, and merchant details. I cannot checkout, edit your cart, manage your wishlist, apply vouchers, or access your account.",
};

function visibleMessages(messages) {
  return messages.filter((message) => message.content.trim() !== "");
}

function messageLines(content) {
  return content
    .replace(/\r\n/g, "\n")
    .replace(/\s+-\s+\*\*/g, "\n- **")
    .replace(/\s+-\s+/g, "\n- ")
    .replace(/\s+(\*\*Details:\*\*)/g, "\n$1")
    .split("\n")
    .map((line) => line.replace(/\*\*/g, "").trim())
    .filter(Boolean);
}

export default function AiHelpChat() {
  const { user, isAuthLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([STARTER_MESSAGE]);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const canSend = draft.trim() !== "" && !isSending;
  const chatMessages = useMemo(() => visibleMessages(messages), [messages]);
  const isLoggedIn = Boolean(user);

  if (isAuthLoading) {
    return null;
  }

  const openChat = () => {
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const sendMessage = async (event) => {
    event?.preventDefault();
    const content = draft.trim();
    if (!content || isSending) {
      return;
    }

    const nextMessages = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setDraft("");
    setError("");
    setIsSending(true);

    try {
      const response = await fetch("/api/ai_help_chat.php", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: nextMessages
            .filter((message) => message !== STARTER_MESSAGE)
            .map(({ role, content }) => ({ role, content })),
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        const debug = payload.debug
          ? ` Debug ${payload.debug.status}: ${payload.debug.message}`
          : "";
        throw new Error(`${payload.error || "AI help is unavailable."}${debug}`);
      }
      setMessages((current) => [
        ...current,
        { role: "assistant", content: payload.reply || "No answer was returned." },
      ]);
    } catch (err) {
      setError(err.message || "AI help is unavailable.");
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: "I cannot reach the AI help service right now. Please try again later.",
        },
      ]);
    } finally {
      setIsSending(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-[900] font-sans">
      {isOpen && (
        <section className={`mb-3 flex w-[min(380px,calc(100vw-40px))] flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-2xl ${isLoggedIn ? "h-[520px]" : ""}`}>
          <header className="flex items-center justify-between border-b border-gray-100 bg-[#003366] px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
                <Bot size={19} />
              </span>
              <div>
                <h2 className="text-sm font-bold">IskoMart AI Help</h2>
                <p className="text-[11px] text-white/70">Public listings only</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-md p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
              aria-label="Close AI help chat"
            >
              <X size={18} />
            </button>
          </header>

          {!isLoggedIn ? (
            <div className="bg-[#F5F7F9] px-5 py-6">
              <div className="rounded-lg border border-gray-100 bg-white p-5 text-center shadow-sm">
                <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#003366]/10 text-[#003366]">
                  <LogIn size={20} />
                </div>
                <h3 className="text-sm font-bold text-[#003366]">Login required</h3>
                <p className="mt-2 text-xs leading-relaxed text-gray-500">
                  Sign in to use IskoMart AI Help for product, service, and price questions.
                </p>
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="mt-4 inline-flex items-center justify-center rounded-md bg-[#FF851B] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#e87516]"
                >
                  Login now
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 space-y-3 overflow-y-auto bg-[#F5F7F9] px-4 py-4">
                {chatMessages.map((message, index) => {
                  const isUser = message.role === "user";
                  return (
                    <div
                      key={`${message.role}-${index}`}
                      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[82%] rounded-lg px-3 py-2 text-sm leading-relaxed shadow-sm ${
                          isUser
                            ? "bg-[#003366] text-white"
                            : "border border-gray-100 bg-white text-gray-700"
                        }`}
                  >
                    {messageLines(message.content).map((line, lineIndex) => (
                      <span key={`${line}-${lineIndex}`} className="block">
                        {line}
                      </span>
                    ))}
                  </div>
                </div>
              );
                })}
                {isSending && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-2 rounded-lg border border-gray-100 bg-white px-3 py-2 text-sm text-gray-500 shadow-sm">
                      <Loader2 size={15} className="animate-spin" />
                      Typing...
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="border-t border-red-100 bg-red-50 px-4 py-2 text-xs font-semibold text-red-600">
                  {error}
                </div>
              )}

              <form onSubmit={sendMessage} className="flex items-end gap-2 border-t border-gray-100 bg-white p-3">
                <textarea
                  ref={inputRef}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      sendMessage(event);
                    }
                  }}
                  rows={2}
                  className="max-h-24 min-h-10 flex-1 resize-none rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-[#0074D9] focus:ring-2 focus:ring-[#0074D9]/15"
                  placeholder="Ask for a product or service..."
                />
                <button
                  type="submit"
                  disabled={!canSend}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#FF851B] text-white transition hover:bg-[#e87516] disabled:cursor-not-allowed disabled:bg-gray-300"
                  aria-label="Send message"
                >
                  {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
              </form>
            </>
          )}
        </section>
      )}

      {!isOpen && (
        <button
          type="button"
          onClick={openChat}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[#003366] text-white shadow-xl transition hover:bg-[#00264d] focus:outline-none focus:ring-4 focus:ring-[#0074D9]/25"
          aria-label="Open AI help chat"
        >
          <MessageCircle size={24} />
        </button>
      )}
    </div>
  );
}
