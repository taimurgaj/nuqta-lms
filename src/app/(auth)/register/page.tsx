"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { BookOpen } from "lucide-react";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultJoinCode = searchParams.get("joinCode") || "";

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
    joinCode: defaultJoinCode,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/users/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "کچھ غلط ہوا");
      setLoading(false);
      return;
    }

    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-2xl mb-4">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">نیا کھاتہ بنائیں</h1>
          <p className="text-gray-500 mt-1">اردو تعلیمی نظام میں شامل ہوں</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">پورا نام</label>
              <input
                type="text"
                className="input-urdu"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">برقی خط</label>
              <input
                type="email"
                className="input-urdu"
                style={{ direction: "ltr", textAlign: "left" }}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">خفیہ رمز</label>
              <input
                type="password"
                className="input-urdu"
                placeholder="کم از کم ۸ حروف"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                minLength={8}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ادارے کا کوڈ
                <span className="text-xs text-red-500 font-normal mr-1">*</span>
              </label>
              <input
                type="text"
                className="input-urdu text-center tracking-widest"
                value={form.joinCode}
                onChange={(e) => setForm({ ...form, joinCode: e.target.value })}
                maxLength={10}
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                اپنے ادارے کے منتظم سے ۸ حرفی کوڈ حاصل کریں —{" "}
                <a href="/orgs/register" className="text-blue-600 hover:underline">ادارہ رجسٹر کریں</a>
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <p className="text-xs text-gray-400 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              تمام نئے کھاتہ بطور طالب علم بنتے ہیں۔ منتظم آپ کو استاد کا درجہ دے سکتے ہیں۔
            </p>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 mt-2"
            >
              {loading ? "اندراج ہو رہا ہے..." : "اندراج کریں"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            کھاتہ پہلے سے ہے؟{" "}
            <Link href="/login" className="text-blue-700 font-medium hover:underline">
              داخل ہوں
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
