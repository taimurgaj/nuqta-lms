"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock } from "lucide-react";

function GateFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/login";

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/gate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.push(next);
      router.refresh();
    } else {
      setError("غلط رمز — دوبارہ کوشش کریں");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4" dir="rtl">
      <div className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
        <div className="w-12 h-12 bg-blue-900/40 rounded-xl flex items-center justify-center mx-auto mb-4">
          <Lock className="w-6 h-6 text-blue-400" />
        </div>
        <h1 className="text-lg font-bold text-white mb-1" style={{ fontFamily: "var(--font-urdu), serif" }}>
          نقطہ پائلٹ
        </h1>
        <p className="text-sm text-gray-400 mb-6" style={{ fontFamily: "var(--font-urdu), serif" }}>
          یہ حصہ فی الحال صرف مدعو اسکولوں کے لیے ہے۔ رمز درج کریں۔
        </p>
        <form onSubmit={submit} className="space-y-3">
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="پائلٹ رمز"
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-center focus:outline-none focus:border-blue-500"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors"
          >
            {loading ? "جانچ ہو رہی ہے..." : "داخل ہوں"}
          </button>
        </form>
        <p className="text-xs text-gray-500 mt-6" style={{ fontFamily: "var(--font-urdu), serif" }}>
          صرف ٹیسٹ رن دیکھنا ہے؟{" "}
          <a href="https://learn.nuqta.dev" className="text-blue-400 hover:text-blue-300">
            نقطہ سیکھیں
          </a>{" "}
          پر جائیں — وہاں رمز کی ضرورت نہیں۔
        </p>
      </div>
    </div>
  );
}

export default function GatePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950" />}>
      <GateFormInner />
    </Suspense>
  );
}
