"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { BookOpen, Eye, EyeOff, GraduationCap, MapPin, Building2 } from "lucide-react";

interface OrgInfo {
  name: string;
  slug: string;
  city: string | null;
}

export default function OrgHubPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();

  const [org, setOrg] = useState<OrgInfo | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    fetch(`/api/orgs/${slug}`)
      .then((r) => {
        if (!r.ok) { setNotFound(true); return null; }
        return r.json();
      })
      .then((d) => d && setOrg(d));
  }, [slug]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });
    if (res?.error) {
      setError("برقی خط یا خفیہ رمز غلط ہے");
      setLoading(false);
      return;
    }
    const me = await fetch("/api/me").then((r) => r.json());
    // Validate the user actually belongs to this org
    if (me.orgSlug !== slug) {
      await signOut({ redirect: false });
      setError("آپ اس ادارے کے رکن نہیں ہیں");
      setLoading(false);
      return;
    }
    if (me.role === "teacher" || me.role === "admin") router.push("/teacher/dashboard");
    else router.push("/student/dashboard");
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
        <div className="text-center">
          <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h1 className="text-2xl font-bold text-gray-700 mb-2">ادارہ نہیں ملا</h1>
          <p className="text-gray-500 mb-6">یہ پتہ درست نہیں ہے</p>
          <Link href="/" className="btn-primary">مرکزی صفحہ</Link>
        </div>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-700 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        {/* Org branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur rounded-2xl mb-4">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">{org.name}</h1>
          {org.city && (
            <p className="text-blue-200 flex items-center justify-center gap-1.5 text-sm">
              <MapPin className="w-3.5 h-3.5" />
              {org.city}
            </p>
          )}
          <div className="flex items-center justify-center gap-2 mt-3">
            <BookOpen className="w-3.5 h-3.5 text-blue-300" />
            <span className="text-blue-300 text-sm">نقطہ کلاس روم</span>
          </div>
        </div>

        {/* Login card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-1">داخل ہوں</h2>
          <p className="text-sm text-gray-500 mb-6">{org.name} کے کھاتہ میں</p>

          <form onSubmit={handleLogin} className="space-y-4">
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
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  className="input-urdu pr-10"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  onClick={() => setShowPw(!showPw)}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3"
              style={{ background: "#1e40af" }}
            >
              {loading ? "داخل ہو رہے ہیں..." : "داخل ہوں"}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-gray-100 text-center space-y-2">
            <p className="text-sm text-gray-500">
              نیا کھاتہ بنائیں؟{" "}
              <Link href={`/register?joinCode=`} className="text-blue-700 font-medium hover:underline">
                اندراج کریں
              </Link>
            </p>
            <p className="text-xs text-gray-400">
              اندراج کے لیے ادارے کا کوڈ درکار ہے — منتظم سے لیں
            </p>
          </div>
        </div>

        <p className="text-center text-blue-300 text-xs mt-6">
          <Link href="/" className="hover:text-white transition-colors">نقطہ کلاس روم</Link>
          {" · "}
          <span className="font-mono">/org/{slug}</span>
        </p>
      </div>
    </div>
  );
}
