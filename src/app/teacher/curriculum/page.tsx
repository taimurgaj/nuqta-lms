"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Library, X, BookOpen, Lock } from "lucide-react";

interface CurriculumItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  order: number;
  tier: string;
  content: string;
}

export default function CurriculumLibrary() {
  const { data: session } = useSession();
  const user = session?.user as { orgName?: string | null; orgTier?: string } | undefined;

  const [items, setItems] = useState<CurriculumItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewItem, setViewItem] = useState<CurriculumItem | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch("/api/curriculum")
      .then((r) => r.json())
      .then((d) => setItems(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout
      title="نصاب"
      subtitle={user?.orgName ? `${user.orgName} کا مقرر نصاب` : "مقرر نصاب"}
    >
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-6 text-sm text-blue-700 flex items-center gap-2">
        <Lock className="w-4 h-4 flex-shrink-0" />
        نصاب مقرر ہے — نقطہ کے سرکاری اسباق پر مشتمل، اساتذہ نیا سبق شامل نہیں کر سکتے۔ اپنی کلاس کو کوئی سبق اسائنمنٹ کے طور پر دینے کے لیے &quot;اسائنمنٹس&quot; استعمال کریں۔
        {user?.orgTier === "demo" && " ڈیمو اکاؤنٹس میں ۵ اسباق دستیاب ہیں — پائلٹ میں مکمل ۲۰ اسباق شامل ہیں۔"}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-700 rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20">
          <Library className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-bold text-gray-700 mb-2">نصاب لوڈ نہیں ہو سکا</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item) => (
            <div key={item.id} className="card p-5 hover:shadow-md transition-shadow flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-teal-700" />
                </div>
                <span className="badge badge-gray text-xs">سبق {item.order}</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
              <p className="text-sm text-gray-600 mb-4 flex-1 line-clamp-2">{item.description}</p>
              <button onClick={() => setViewItem(item)} className="btn-secondary w-full justify-center text-sm py-2">
                مواد دیکھیں
              </button>
            </div>
          ))}
        </div>
      )}

      {viewItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" dir="rtl">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{viewItem.title}</h2>
                <p className="text-sm text-gray-500">سبق {viewItem.order}</p>
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
