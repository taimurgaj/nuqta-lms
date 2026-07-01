"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, Check, Copy, GraduationCap, ArrowLeft } from "lucide-react";

function toSlug(name: string) {
  // Auto-generate from ASCII org names; returns empty for pure Urdu names (user fills manually)
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .slice(0, 50);
}

function sanitizeSlug(raw: string) {
  // Used when user types directly — allow any chars, just clean spaces and length
  return raw.trim().replace(/\s+/g, "-").slice(0, 60);
}

interface SuccessData {
  name: string;
  slug: string;
  joinCode: string;
}

export default function OrgRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    orgName: "", city: "", slug: "",
    adminName: "", adminEmail: "", adminPassword: "",
  });
  const [slugEdited, setSlugEdited] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<SuccessData | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  function handleOrgName(name: string) {
    setForm((f) => ({
      ...f,
      orgName: name,
      slug: slugEdited ? f.slug : toSlug(name),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/orgs/register", {
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
    setSuccess(data);
    setLoading(false);
  }

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  if (success) {
    const hubUrl = `${window.location.origin}/org/${success.slug}`;
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-4" dir="rtl">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-2xl mb-4">
              <Check className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">ادارہ کامیابی سے بن گیا!</h1>
            <p className="text-gray-500 mt-1">{success.name}</p>
          </div>

          <div className="card p-6 space-y-5">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">ادارے کا مرکزی صفحہ</p>
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
                <span className="flex-1 text-sm text-blue-700 font-mono break-all">{hubUrl}</span>
                <button onClick={() => copy(hubUrl, "url")} className="text-gray-400 hover:text-blue-600 flex-shrink-0">
                  {copied === "url" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">یہ لنک تمام اساتذہ اور طلبہ کے ساتھ بانٹیں</p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">شمولیتی کوڈ</p>
              <div className="flex items-center gap-2 bg-blue-50 rounded-xl px-4 py-3 border border-blue-200">
                <span className="flex-1 text-xl font-mono font-bold text-blue-800 tracking-widest">{success.joinCode}</span>
                <button onClick={() => copy(success.joinCode, "code")} className="text-blue-400 hover:text-blue-700 flex-shrink-0">
                  {copied === "code" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">اندراج کے وقت یہ کوڈ درکار ہوگا — اسے محفوظ رکھیں</p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm text-yellow-800">
              ابھی <strong>مرکزی صفحہ</strong> کے ذریعے اپنے منتظم کھاتہ سے داخل ہوں
            </div>

            <button
              onClick={() => router.push(`/org/${success.slug}`)}
              className="btn-primary w-full justify-center py-3"
              style={{ background: "#059669" }}
            >
              <ArrowLeft className="w-4 h-4" />
              ادارے کے مرکزی صفحے پر جائیں
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-700 rounded-2xl mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">اپنا ادارہ رجسٹر کریں</h1>
          <p className="text-gray-500 mt-1">اسکول، کالج یا تعلیمی ادارے کے لیے اپنا مرکزی نظام بنائیں</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 pb-2 border-b border-gray-100">ادارے کی معلومات</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ادارے کا نام *</label>
              <input
                className="input-urdu"
                value={form.orgName}
                onChange={(e) => handleOrgName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">شہر</label>
                <input
                  className="input-urdu"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">شناختی پتہ *</label>
                <input
                  className="input-urdu ltr-text text-sm"
                  value={form.slug}
                  onChange={(e) => { setSlugEdited(true); setForm({ ...form, slug: sanitizeSlug(e.target.value) }); }}
                  dir="ltr"
                  required
                />
              </div>
            </div>

            <div className="pt-2">
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 pb-2 border-b border-gray-100">منتظم کا کھاتہ</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">منتظم کا نام *</label>
              <input
                className="input-urdu"
                value={form.adminName}
                onChange={(e) => setForm({ ...form, adminName: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">برقی خط *</label>
              <input
                type="email"
                className="input-urdu"
                style={{ direction: "ltr", textAlign: "left" }}
                value={form.adminEmail}
                onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">خفیہ رمز *</label>
              <input
                type="password"
                className="input-urdu"
                placeholder="کم از کم ۸ حروف"
                value={form.adminPassword}
                onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
                minLength={8}
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 mt-2"
            >
              <GraduationCap className="w-4 h-4" />
              {loading ? "بن رہا ہے..." : "ادارہ بنائیں"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            پہلے سے کھاتہ ہے؟{" "}
            <Link href="/login" className="text-blue-700 font-medium hover:underline">داخل ہوں</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
