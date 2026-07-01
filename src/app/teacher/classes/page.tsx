"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Users, BookOpen, Copy, Check } from "lucide-react";
import Link from "next/link";

interface ClassData {
  id: string;
  name: string;
  description: string;
  subject: string | null;
  gradeLevel: string;
  code: string;
  isActive: boolean;
  enrollments: Array<{ student: { id: string; name: string; email: string } }>;
  assignments: Array<{ id: string }>;
  createdAt: string;
}

export default function TeacherClasses() {
  const { data: session } = useSession();
  const u = session?.user as { orgSlug?: string; isOrgAdmin?: boolean } | undefined;
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/classes")
      .then((r) => r.json())
      .then(setClasses)
      .finally(() => setLoading(false));
  }, []);

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  return (
    <DashboardLayout
      title="میرے اسباق"
      subtitle={`${classes.length} اسباق`}
      actions={
        u?.isOrgAdmin ? (
          <Link href="/teacher/org" className="btn-primary text-sm">
            سبق بنائیں ← ادارے کا انتظام
          </Link>
        ) : undefined
      }
    >
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-700 rounded-full animate-spin" />
        </div>
      ) : classes.length === 0 ? (
        <div className="text-center py-20">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-bold text-gray-700 mb-2">ابھی تک کوئی سبق نہیں</h3>
          <p className="text-gray-500 mb-6">
            {u?.isOrgAdmin
              ? "ادارے کے انتظام سے اسباق بنائیں اور اساتذہ مقرر کریں"
              : "منتظم آپ کو سبق میں شامل کریں گے"}
          </p>
          {u?.isOrgAdmin && (
            <Link href="/teacher/org" className="btn-primary">
              ادارے کا انتظام
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {classes.map((cls) => (
            <div key={cls.id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-blue-700" />
                </div>
                {cls.subject && <span className="badge badge-blue">{cls.subject}</span>}
              </div>

              <h3 className="font-bold text-gray-900 mb-1">{cls.name}</h3>
              <p className="text-sm text-gray-500 mb-3">سطح: {cls.gradeLevel}</p>
              {cls.description && <p className="text-sm text-gray-600 mb-3 line-clamp-2">{cls.description}</p>}

              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {cls.enrollments.length} طلبہ
                </span>
                <span>{cls.assignments.length} مشقیں</span>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">سبق کا رمز</p>
                  <p className="font-mono font-bold text-gray-800 tracking-widest">{cls.code}</p>
                </div>
                <button onClick={() => copyCode(cls.code)} className="text-gray-400 hover:text-blue-600 transition-colors" title="نقل کریں">
                  {copiedCode === cls.code ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <Link href={`/teacher/classes/${cls.id}`} className="btn-primary w-full text-sm justify-center py-2 block text-center">
                سبق کھولیں
              </Link>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
