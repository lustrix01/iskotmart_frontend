import React, { useEffect, useState } from "react";
import { MessageSquare, Search } from "lucide-react";

export default function Messages() {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadThreads = async () => {
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

        if (isMounted) {
          setThreads(Array.isArray(payload.threads) ? payload.threads : []);
        }
      } catch (fetchError) {
        if (isMounted) {
          setThreads([]);
          setError(fetchError.message || "Unable to load messages.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadThreads();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="max-w-full mx-auto animate-in fade-in duration-500 h-[calc(100vh-140px)] flex flex-col">
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
                placeholder="Search conversations..."
                disabled
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs text-gray-400"
              />
            </div>
          </div>

          <div className="flex-grow flex items-center justify-center px-6 text-center">
            <p className="text-[11px] font-medium text-gray-400">
              {loading
                ? "Loading conversations..."
                : threads.length > 0
                  ? `${threads.length} conversation${threads.length === 1 ? "" : "s"} available.`
                  : "No conversations yet."}
            </p>
          </div>
        </div>

        <div className="flex-grow flex items-center justify-center bg-[#F8FAFC]/30 p-8">
          <div className="max-w-md text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-white border border-gray-100 flex items-center justify-center mb-4 shadow-sm">
              <MessageSquare size={24} className="text-[#003366]" />
            </div>
            <h2 className="text-sm font-bold text-[#003366]">
              {threads.length > 0 ? "Messages loaded" : "No messages available"}
            </h2>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              {error
                ? error
                : "Your customer-to-merchant conversations will appear here when messaging history is connected."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
