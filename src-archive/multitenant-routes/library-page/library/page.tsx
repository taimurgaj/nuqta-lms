"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Search, Download, Building2, ArrowLeft, Filter, GraduationCap } from "lucide-react";

interface CurriculumItem {
  id: string;
  title: string;
  description: string;
  subject: string;
  gradeLevel: string;
  type: string;
  downloads: number;
  creator: { name: string };
  createdAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  lesson: "سبق",
  exercise: "مشق",
  quiz: "آزمائش",
  resource: "مواد",
};

const SUBJECT_COLORS: Record<string, string> = {
  "اردو": "bg-blue-100 text-blue-700",
  "ریاضی": "bg-green-100 text-green-700",
  "سائنس": "bg-purple-100 text-purple-700",
  "انگریزی": "bg-orange-100 text-orange-700",
  "تاریخ": "bg-red-100 text-red-700",
  "جغرافیہ": "bg-teal-100 text-teal-700",
  "اسلامیات": "bg-yellow-100 text-yellow-700",
  "کمپیوٹر": "bg-pink-100 text-pink-700",
};

export default function PublicLibraryPage() {
  const [items, setItems] = useState<CurriculumItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("");
  const [type, setType] = useState("");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ scope: "global" });
    if (search) params.set("search", search);
    if (subject) params.set("subject", subject);
    if (type) params.set("type", type);

    fetch(`/api/curriculum?${params}`)
      .then((r) => r.json())
      .then(setItems)
      .finally(() => setLoading(false));
  }, [search, subject, type]);

  useEffect(() => {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_name: "library_view", path: window.location.pathname }),
    }).catch(() => {});
  }, []);

  const subjects = ["اردو", "ریاضی", "سائنس", "انگریزی", "تاریخ", "جغرافیہ", "اسلامیات", "کمپیوٹر"];

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-700 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm text-gray-900">عالمی کتب خانہ</p>
              <p className="text-xs text-gray-500">نقطہ کلاس روم</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link href="/login" className="btn-secondary text-sm">
              داخل ہوں
            </Link>
            <Link href="/orgs/register" className="btn-primary text-sm">
              <Building2 className="w-4 h-4" />
              ادارہ رجسٹر کریں
            </Link>
          </div>
        </div>
      </header>

      {/* Hero banner */}
      <div className="bg-gradient-to-l from-blue-700 to-blue-900 text-white">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <h1 className="text-3xl font-bold mb-2">عالمی اردو کتب خانہ</h1>
          <p className="text-blue-200 mb-6 max-w-xl" style={{ lineHeight: "1.8" }}>
            پاکستان بھر کے اساتذہ کا بنایا ہوا مفت تعلیمی مواد — سبق، مشقیں اور آزمائشیں، سب اردو میں
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/orgs/register"
              className="inline-flex items-center gap-2 bg-white text-blue-700 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-50 transition-colors"
            >
              <GraduationCap className="w-4 h-4" />
              اپنا ادارہ رجسٹر کریں
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-white/20 text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-white/30 transition-colors border border-white/30"
            >
              داخل ہوں
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Search + filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              className="input-urdu pr-9 bg-white"
              placeholder="مواد تلاش کریں..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="input-urdu w-auto bg-white"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          >
            <option value="">تمام مضامین</option>
            {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            className="input-urdu w-auto bg-white"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="">تمام اقسام</option>
            {Object.entries(TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          {(search || subject || type) && (
            <button
              onClick={() => { setSearch(""); setSubject(""); setType(""); }}
              className="btn-secondary text-sm"
            >
              <Filter className="w-3.5 h-3.5" />
              صاف کریں
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-700 rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-14 h-14 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">کوئی مواد نہیں ملا</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">{items.length} اشیاء ملیں</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((item) => (
                <div key={item.id} className="card p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${SUBJECT_COLORS[item.subject] || "bg-gray-100 text-gray-600"}`}>
                      {item.subject}
                    </span>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      {TYPE_LABELS[item.type] || item.type}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1 leading-snug">{item.title}</h3>
                  {item.description && (
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2" style={{ lineHeight: "1.7" }}>
                      {item.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-100">
                    <span>{item.creator.name}</span>
                    <span className="flex items-center gap-1">
                      <Download className="w-3 h-3" />
                      {item.downloads}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Footer CTA */}
      <div className="bg-white border-t border-gray-200 mt-10">
        <div className="max-w-6xl mx-auto px-6 py-10 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">اپنے ادارے کے لیے مکمل نظام چاہیے؟</h2>
          <p className="text-gray-500 mb-5 text-sm">
            جماعتیں، مشقیں، تجزیات، اور ادارے کا اپنا کتب خانہ — سب کچھ اردو میں
          </p>
          <Link href="/orgs/register" className="btn-primary">
            <Building2 className="w-4 h-4" />
            مفت ادارہ رجسٹر کریں
          </Link>
        </div>
      </div>
    </div>
  );
}
