"use client";

import { useState, useEffect, useRef } from "react";
import { signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen, Eye, EyeOff, Search, MapPin, Building2, X, ArrowLeft } from "lucide-react";

interface OrgResult {
  id: string;
  name: string;
  slug: string;
  city: string | null;
}

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<OrgResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<OrgResult | null>(null);
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim() || selectedOrg) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      const res = await fetch(`/api/orgs/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.orgs || []);
      setShowDropdown(true);
      setSearching(false);
    }, 300);
  }, [query, selectedOrg]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function selectOrg(org: OrgResult) {
    setSelectedOrg(org);
    setQuery(org.name);
    setResults([]);
    setShowDropdown(false);
    setStep(2);
  }

  function clearOrg() {
    setSelectedOrg(null);
    setQuery("");
    setStep(1);
    setError("");
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedOrg) return;
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
    if (me.orgSlug !== selectedOrg.slug) {
      await signOut({ redirect: false });
      setError("آپ کا کھاتہ اس ادارے سے منسلک نہیں");
      setLoading(false);
      return;
    }
    if (me.role === "teacher" || me.role === "admin") router.push("/teacher/dashboard");
    else router.push("/student/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-700 rounded-2xl mb-4">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">اردو تعلیمی نظام</h1>
          <p className="text-gray-500 mt-1">اپنے ادارے میں داخل ہوں</p>
        </div>

        <div className="card p-8">
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-7">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step >= 1 ? "bg-blue-700 text-white" : "bg-gray-200 text-gray-500"}`}>۱</div>
            <div className={`flex-1 h-0.5 transition-colors ${step >= 2 ? "bg-blue-700" : "bg-gray-200"}`} />
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step >= 2 ? "bg-blue-700 text-white" : "bg-gray-200 text-gray-500"}`}>۲</div>
          </div>

          {step === 1 ? (
            <div>
              <h2 className="text-base font-bold text-gray-800 mb-1">اپنا ادارہ منتخب کریں</h2>
              <p className="text-sm text-gray-500 mb-4">ادارے کا نام تلاش کریں</p>

              <div className="relative" ref={dropdownRef}>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    className="input-urdu pr-9"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => results.length > 0 && setShowDropdown(true)}
                    autoFocus
                  />
                  {searching && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-blue-300 border-t-blue-700 rounded-full animate-spin" />
                  )}
                </div>

                {showDropdown && results.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                    {results.map((org) => (
                      <button
                        key={org.id}
                        onMouseDown={() => selectOrg(org)}
                        className="w-full text-right px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-0 flex items-center gap-3 transition-colors"
                      >
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-4 h-4 text-blue-700" />
                        </div>
                        <div className="flex-1 text-right">
                          <p className="font-medium text-gray-900 text-sm">{org.name}</p>
                          {org.city && (
                            <p className="text-xs text-gray-400 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {org.city}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {showDropdown && query && results.length === 0 && !searching && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl px-4 py-3 text-sm text-gray-400 text-center">
                    کوئی ادارہ نہیں ملا
                  </div>
                )}
              </div>

              <div className="mt-6 pt-5 border-t border-gray-100 text-center space-y-2">
                <Link
                  href="/library"
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  بغیر ادارے کے عالمی کتب خانہ دیکھیں
                </Link>
                <p className="text-xs text-gray-400">
                  (بغیر ادارے کے صرف کتب خانہ دستیاب ہے)
                </p>
              </div>
            </div>
          ) : (
            <div>
              {/* Selected org badge */}
              <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-5">
                <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-blue-900 text-sm truncate">{selectedOrg?.name}</p>
                  {selectedOrg?.city && (
                    <p className="text-xs text-blue-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {selectedOrg.city}
                    </p>
                  )}
                </div>
                <button onClick={clearOrg} title="ادارہ بدلیں">
                  <X className="w-4 h-4 text-blue-400 hover:text-blue-700 transition-colors" />
                </button>
              </div>

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
                    autoFocus
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
                >
                  {loading ? "داخل ہو رہے ہیں..." : "داخل ہوں"}
                </button>
              </form>

              <p className="text-center text-sm text-gray-500 mt-5">
                کھاتہ نہیں ہے؟{" "}
                <Link href="/register" className="text-blue-700 font-medium hover:underline">
                  اندراج کریں
                </Link>
              </p>
            </div>
          )}
        </div>

        <div className="text-center text-xs text-gray-400 mt-5 space-y-1">
          <p>
            ادارہ رجسٹر کرنا ہے؟{" "}
            <Link href="/orgs/register" className="hover:text-blue-600 transition-colors">
              یہاں کلک کریں
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
