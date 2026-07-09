"use client";

import { useEffect, useRef, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Send, Brain, Sparkles, RotateCcw } from "lucide-react";

interface Message {
  id?: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
}

const suggestions = [
  "لوپ (جبتک) کیسے کام کرتا ہے، سمجھائیں",
  "متغیر اور فہرست میں کیا فرق ہے؟",
  "میرے کوڈ میں غلطی ہے، اسے ڈھونڈنے میں مدد کریں (اسائنمنٹ کا جواب نہیں، صرف رہنمائی)",
  "فنکشن کب استعمال کرنا چاہیے؟",
  "اگر/ورنہ کی مشق کے لیے کوئی آئیڈیا دیں",
];

export default function AITutorPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `session-${Date.now()}`);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch(`/api/ai-tutor?sessionId=${sessionId}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setMessages(data);
      });
  }, [sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text?: string) {
    const msg = text || input.trim();
    if (!msg || loading) return;

    const userMsg: Message = { role: "user", content: msg };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const history = messages.slice(-8).map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/ai-tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, sessionId, history }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "معذرت، کوئی مسئلہ ہوا۔ دوبارہ کوشش کریں۔" }]);
    }
    setLoading(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <DashboardLayout title="ذہین معلم" subtitle="اردو مصنوعی ذہانت کا معلم">
      <div className="flex flex-col h-[calc(100vh-180px)] max-w-3xl mx-auto">
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto bg-white rounded-2xl border border-gray-200 shadow-sm mb-4 flex flex-col">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-20 h-20 bg-purple-100 rounded-2xl flex items-center justify-center mb-4">
                <Brain className="w-10 h-10 text-purple-700" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">ذہین معلم سے بات کریں</h2>
              <p className="text-gray-500 mb-6 max-w-sm" style={{ lineHeight: "2" }}>
                میں آپ کا کوڈنگ معلم ہوں — پروگرامنگ کے تصورات سمجھنے اور غلطیاں ڈھونڈنے میں مدد کرتا ہوں۔
                لیکن میں آپ کی اسائنمنٹس کا جواب خود نہیں دیتا — رہنمائی کرتا ہوں تاکہ آپ خود سیکھیں۔
              </p>
              <div className="grid grid-cols-1 gap-2 w-full max-w-md">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="text-sm text-right bg-purple-50 text-purple-800 border border-purple-200 rounded-xl px-4 py-2.5 hover:bg-purple-100 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 inline ml-2 text-purple-500" />
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  {m.role === "assistant" && (
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 ml-2 mt-1">
                      <Brain className="w-4 h-4 text-purple-700" />
                    </div>
                  )}
                  <div className={m.role === "user" ? "chat-bubble-user" : "chat-bubble-ai"}>
                    <p className="text-sm urdu-text leading-relaxed whitespace-pre-wrap">{m.content}</p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center ml-2">
                    <Brain className="w-4 h-4 text-purple-700" />
                  </div>
                  <div className="chat-bubble-ai">
                    <div className="flex gap-1 py-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-3">
          <div className="flex items-end gap-3">
            {messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 flex-shrink-0"
                title="نئی بات چیت"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
            <textarea
              ref={inputRef}
              className="flex-1 resize-none outline-none text-gray-900 placeholder-gray-400 max-h-32"
              style={{ fontFamily: "var(--font-urdu)", direction: "rtl", textAlign: "right", minHeight: "44px" }}
              placeholder="یہاں اپنا سوال لکھیں..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="btn-primary px-4 py-2.5 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">Enter دبائیں تاکہ بھیجیں · Shift+Enter نئی لائن کے لیے</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
