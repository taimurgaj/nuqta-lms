"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Plus, Library, Download, Search, X, BookOpen, Globe, Building2 } from "lucide-react";

interface CurriculumItem {
  id: string;
  title: string;
  description: string;
  subject: string;
  gradeLevel: string;
  type: string;
  content: string;
  isPublic: boolean;
  orgId: string | null;
  tags: string;
  downloads: number;
  createdAt: string;
  creator: { name: string };
}

export default function CurriculumLibrary() {
  const { data: session } = useSession();
  const user = session?.user as { orgId?: string | null; orgName?: string | null } | undefined;
  const hasOrg = !!user?.orgId;

  const [tab, setTab] = useState<"global" | "org">(hasOrg ? "org" : "global");
  const [globalItems, setGlobalItems] = useState<CurriculumItem[]>([]);
  const [orgItems, setOrgItems] = useState<CurriculumItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [viewItem, setViewItem] = useState<CurriculumItem | null>(null);
  const [search, setSearch] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterType, setFilterType] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", subject: "", gradeLevel: "", type: "lesson",
    content: "", isPublic: true, tags: "",
  });

  const typeLabels: Record<string, string> = { lesson: "سبق", exercise: "مشق", quiz: "آزمائش", resource: "ماخذ" };
  const subjects = ["اردو", "ریاضی", "سائنس", "انگریزی", "تاریخ", "جغرافیہ", "اسلامیات", "کمپیوٹر"];
  const grades = ["پہلی", "دوسری", "تیسری", "چوتھی", "پانچویں", "چھٹی", "ساتویں", "آٹھویں", "نہم", "دہم"];

  function buildParams(scope: string) {
    const p = new URLSearchParams({ scope });
    if (search) p.set("search", search);
    if (filterSubject) p.set("subject", filterSubject);
    if (filterType) p.set("type", filterType);
    return p;
  }

  function loadItems() {
    setLoading(true);
    const fetches = [
      fetch(`/api/curriculum?${buildParams("global")}`).then((r) => r.json()),
    ];
    if (hasOrg) {
      fetches.push(fetch(`/api/curriculum?${buildParams("org")}`).then((r) => r.json()));
    }
    Promise.all(fetches).then(([g, o]) => {
      setGlobalItems(Array.isArray(g) ? g : []);
      if (o) setOrgItems(Array.isArray(o) ? o : []);
    }).finally(() => setLoading(false));
  }

  useEffect(() => { loadItems(); }, [search, filterSubject, filterType]);

  async function createItem(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/curriculum", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, tags: form.tags.split("،").map((t) => t.trim()).filter(Boolean) }),
    });
    if (res.ok) {
      setShowModal(false);
      setForm({ title: "", description: "", subject: "", gradeLevel: "", type: "lesson", content: "", isPublic: true, tags: "" });
      loadItems();
    }
    setSaving(false);
  }

  const items = tab === "org" ? orgItems : globalItems;

  function ItemCard({ item }: { item: CurriculumItem }) {
    const tags = (() => { try { return JSON.parse(item.tags) as string[]; } catch { return []; } })();
    return (
      <div className="card p-5 hover:shadow-md transition-shadow flex flex-col">
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-teal-700" />
          </div>
          <div className="flex gap-1.5 flex-wrap justify-end">
            <span className="badge badge-blue">{item.subject}</span>
            <span className="badge badge-gray">{typeLabels[item.type] || item.type}</span>
            {item.isPublic
              ? <span className="badge badge-green text-xs flex items-center gap-0.5"><Globe className="w-2.5 h-2.5" />عالمی</span>
              : <span className="badge badge-blue text-xs flex items-center gap-0.5"><Building2 className="w-2.5 h-2.5" />ادارہ</span>
            }
          </div>
        </div>
        <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
        <p className="text-sm text-gray-500 mb-1">جماعت: {item.gradeLevel}</p>
        <p className="text-sm text-gray-600 mb-3 flex-1 line-clamp-2">{item.description}</p>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {tags.slice(0, 3).map((tag) => (
              <span key={tag} className="badge badge-gray text-xs">{tag}</span>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
          <span>{item.creator.name}</span>
          <span className="flex items-center gap-1">
            <Download className="w-3 h-3" />
            {item.downloads} بار
          </span>
        </div>
        <button onClick={() => setViewItem(item)} className="btn-secondary w-full justify-center text-sm py-2">
          مواد دیکھیں
        </button>
      </div>
    );
  }

  return (
    <DashboardLayout
      title="کتب خانہ"
      subtitle="تعلیمی مواد بانٹیں اور دریافت کریں"
      actions={
        <button onClick={() => setShowModal(true)} className="btn-primary text-sm">
          <Plus className="w-4 h-4" />
          نیا مواد
        </button>
      }
    >
      {/* Tab switcher */}
      {hasOrg && (
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
          <button
            onClick={() => setTab("org")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === "org" ? "bg-white shadow text-blue-700" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Building2 className="w-4 h-4" />
            {user?.orgName || "ادارہ جاتی"} کتب خانہ
          </button>
          <button
            onClick={() => setTab("global")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === "global" ? "bg-white shadow text-blue-700" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Globe className="w-4 h-4" />
            عالمی کتب خانہ
          </button>
        </div>
      )}

      {/* Context note */}
      {tab === "global" && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-5 text-sm text-blue-700 flex items-center gap-2">
          <Globe className="w-4 h-4 flex-shrink-0" />
          یہ مواد تمام اداروں کے اساتذہ کے ساتھ مشترک ہے
        </div>
      )}
      {tab === "org" && hasOrg && (
        <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 mb-5 text-sm text-green-700 flex items-center gap-2">
          <Building2 className="w-4 h-4 flex-shrink-0" />
          یہ مواد صرف {user?.orgName} کے اساتذہ کو نظر آئے گا
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input-urdu pr-9" placeholder="تلاش کریں..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input-urdu w-auto" value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)}>
          <option value="">تمام مضامین</option>
          {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="input-urdu w-auto" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="">تمام اقسام</option>
          {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-700 rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20">
          <Library className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-bold text-gray-700 mb-2">کوئی مواد نہیں ملا</h3>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus className="w-4 h-4" />
            پہلا مواد شامل کریں
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item) => <ItemCard key={item.id} item={item} />)}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" dir="rtl">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">نیا تعلیمی مواد</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={createItem} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">عنوان *</label>
                <input className="input-urdu" placeholder="مواد کا نام" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">تفصیل</label>
                <textarea className="input-urdu" rows={2} placeholder="مختصر تفصیل..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">مضمون *</label>
                  <select className="input-urdu" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required>
                    <option value="">منتخب کریں</option>
                    {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">جماعت</label>
                  <select className="input-urdu" value={form.gradeLevel} onChange={(e) => setForm({ ...form, gradeLevel: e.target.value })}>
                    <option value="">منتخب کریں</option>
                    {grades.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">قسم</label>
                  <select className="input-urdu" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">مواد *</label>
                <textarea className="input-urdu" rows={6} placeholder="یہاں اپنا تعلیمی مواد لکھیں..." value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ٹیگز (اردو کاما سے الگ کریں)</label>
                <input className="input-urdu" placeholder="مثلاً: شاعری، غزل، علامہ اقبال" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
              </div>

              {/* Visibility */}
              {hasOrg && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">دسترس</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { val: false, label: `صرف ${user?.orgName}`, icon: <Building2 className="w-4 h-4" />, color: "border-blue-500 bg-blue-50 text-blue-700" },
                      { val: true, label: "تمام اساتذہ", icon: <Globe className="w-4 h-4" />, color: "border-green-500 bg-green-50 text-green-700" },
                    ].map((opt) => (
                      <button
                        key={String(opt.val)}
                        type="button"
                        onClick={() => setForm({ ...form, isPublic: opt.val })}
                        className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2 text-sm font-medium transition-all ${
                          form.isPublic === opt.val ? opt.color : "border-gray-200 text-gray-500 hover:border-gray-300"
                        }`}
                      >
                        {opt.icon}
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {!hasOrg && (
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.isPublic} onChange={(e) => setForm({ ...form, isPublic: e.target.checked })} className="w-4 h-4 rounded" />
                  <span className="text-sm font-medium text-gray-700">دوسرے اساتذہ کے ساتھ بانٹیں</span>
                </label>
              )}

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center py-2.5">
                  {saving ? "شامل ہو رہا ہے..." : "مواد شامل کریں"}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary px-5">منسوخ</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" dir="rtl">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{viewItem.title}</h2>
                <p className="text-sm text-gray-500">{viewItem.subject} · {viewItem.gradeLevel} · {viewItem.creator.name}</p>
              </div>
              <button onClick={() => setViewItem(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            {viewItem.description && <p className="text-gray-600 mb-4 text-sm bg-gray-50 rounded-lg p-3">{viewItem.description}</p>}
            <div className="prose prose-urdu max-w-none text-gray-800 leading-loose whitespace-pre-wrap urdu-text">
              {viewItem.content}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
