"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { ArrowRight, BookOpen, Clock, CheckCircle, AlertCircle, ClipboardList, BarChart2 } from "lucide-react";

interface Submission {
  grade: number | null;
  status: string;
  content: string;
  fileUrl: string | null;
  feedback: string | null;
  submittedAt: string;
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string | null;
  maxPoints: number;
  type: string;
  submissions: Submission[];
}

interface ClassDetail {
  id: string;
  name: string;
  subject: string | null;
  gradeLevel: string;
  code: string;
  teacher: { name: string };
  assignments: Assignment[];
}

const TYPE_LABELS: Record<string, string> = {
  written: "تحریری", code: "رمز نویسی", quiz: "آزمائش", ide: "اڈا", other: "دیگر",
};

export default function StudentClassDetail() {
  const { id } = useParams<{ id: string }>();
  const [cls, setCls] = useState<ClassDetail | null>(null);
  const [tab, setTab] = useState<"assignments" | "grades">("assignments");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/classes/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setCls(data);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <DashboardLayout title="لوڈ ہو رہا ہے...">
      <div className="flex items-center justify-center h-40">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-700 rounded-full animate-spin" />
      </div>
    </DashboardLayout>
  );

  if (error || !cls) return (
    <DashboardLayout title="سبق نہیں ملا">
      <p className="text-gray-500">{error || "یہ سبق موجود نہیں"}</p>
      <Link href="/student/courses" className="text-blue-600 text-sm mt-3 inline-block hover:underline">واپس جائیں</Link>
    </DashboardLayout>
  );

  const submittedCount = cls.assignments.filter((a) => a.submissions.length > 0).length;
  const gradedAssignments = cls.assignments.filter((a) => a.submissions[0]?.status === "graded");
  const grades = gradedAssignments.map((a) => (a.submissions[0].grade! / a.maxPoints) * 100);
  const avg = grades.length > 0 ? Math.round(grades.reduce((a, b) => a + b, 0) / grades.length) : null;

  return (
    <DashboardLayout
      title={cls.name}
      subtitle={`${cls.subject ? `${cls.subject} · ` : ""}${cls.teacher.name}`}
    >
      <Link href="/student/courses" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-5">
        <ArrowRight className="w-3.5 h-3.5" />
        تمام اسباق
      </Link>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{cls.assignments.length}</p>
          <p className="text-xs text-gray-500 mt-1">کل مشقیں</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{submittedCount}</p>
          <p className="text-xs text-gray-500 mt-1">جمع شدہ</p>
        </div>
        <div className="card p-4 text-center">
          <p className={`text-2xl font-bold ${avg === null ? "text-gray-300" : avg >= 80 ? "text-green-600" : avg >= 60 ? "text-yellow-600" : "text-red-600"}`}>
            {avg !== null ? `${avg}%` : "—"}
          </p>
          <p className="text-xs text-gray-500 mt-1">اوسط پوائنٹس</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 max-w-xs">
        {[
          { key: "assignments", label: "مشقیں", icon: <ClipboardList className="w-3.5 h-3.5" /> },
          { key: "grades", label: "نتائج نامہ", icon: <BarChart2 className="w-3.5 h-3.5" /> },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as typeof tab)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              tab === t.key ? "bg-white text-blue-700 shadow-sm" : "text-gray-600 hover:text-gray-800"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Assignments Tab */}
      {tab === "assignments" && (
        <div className="space-y-3">
          {cls.assignments.length === 0 ? (
            <div className="card text-center py-16 text-gray-500">
              <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>ابھی کوئی مشق نہیں</p>
            </div>
          ) : (
            cls.assignments.map((a) => {
              const sub = a.submissions[0] ?? null;
              const isLate = a.dueDate && new Date() > new Date(a.dueDate) && !sub;
              const pct = sub?.grade !== null && sub?.grade !== undefined ? (sub.grade / a.maxPoints) * 100 : null;
              return (
                <Link key={a.id} href={`/student/assignments?highlight=${a.id}`} className="card p-4 block hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        sub?.status === "graded" ? "bg-green-100" :
                        sub ? "bg-yellow-100" :
                        isLate ? "bg-red-100" : "bg-orange-100"
                      }`}>
                        {sub?.status === "graded" ? <CheckCircle className="w-4 h-4 text-green-700" /> :
                         sub ? <Clock className="w-4 h-4 text-yellow-700" /> :
                         isLate ? <AlertCircle className="w-4 h-4 text-red-700" /> :
                         <ClipboardList className="w-4 h-4 text-orange-700" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-gray-900">{a.title}</h3>
                          <span className="badge badge-blue text-xs">{TYPE_LABELS[a.type] ?? a.type}</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{a.description}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                          {a.dueDate && (
                            <span className={`flex items-center gap-1 ${isLate && !sub ? "text-red-500" : ""}`}>
                              <Clock className="w-3 h-3" />
                              {new Date(a.dueDate).toLocaleDateString("ur-PK")}
                            </span>
                          )}
                          <span>{a.maxPoints} پوائنٹس</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      {pct !== null && (
                        <span className={`text-lg font-bold ${pct >= 80 ? "text-green-600" : pct >= 60 ? "text-yellow-600" : "text-red-600"}`}>
                          {sub!.grade}/{a.maxPoints}
                        </span>
                      )}
                      {sub?.status === "graded" && <span className="badge badge-green text-xs">جانچا گیا</span>}
                      {sub?.status === "submitted" && <span className="badge badge-yellow text-xs">جمع شدہ</span>}
                      {sub?.status === "late" && <span className="badge badge-red text-xs">دیر سے</span>}
                      {!sub && !isLate && <span className="badge badge-gray text-xs">زیر التواء</span>}
                      {isLate && !sub && <span className="badge badge-red text-xs">وقت گزر گیا</span>}
                    </div>
                  </div>
                  {sub?.feedback && (
                    <div className="mt-3 bg-blue-50 rounded-lg p-3 border border-blue-100">
                      <p className="text-xs text-blue-600 font-medium mb-1">استاد کا تبصرہ</p>
                      <p className="text-sm text-blue-800">{sub.feedback}</p>
                    </div>
                  )}
                </Link>
              );
            })
          )}
        </div>
      )}

      {/* Gradebook Tab */}
      {tab === "grades" && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">نتائج نامہ</h2>
            {avg !== null && (
              <span className={`badge ${avg >= 80 ? "badge-green" : avg >= 60 ? "badge-yellow" : "badge-red"}`}>
                اوسط: {avg}%
              </span>
            )}
          </div>
          {cls.assignments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">ابھی کوئی مشق نہیں</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-urdu">
                <thead>
                  <tr>
                    <th>مشق</th>
                    <th className="text-center">کل پوائنٹس</th>
                    <th className="text-center">میرے پوائنٹس</th>
                    <th className="text-center">فیصد</th>
                    <th className="text-center">صورتحال</th>
                  </tr>
                </thead>
                <tbody>
                  {cls.assignments.map((a) => {
                    const sub = a.submissions[0] ?? null;
                    const pct = sub?.grade !== null && sub?.grade !== undefined
                      ? Math.round((sub.grade / a.maxPoints) * 100)
                      : null;
                    return (
                      <tr key={a.id}>
                        <td>
                          <Link href={`/student/assignments?highlight=${a.id}`} className="font-medium text-gray-900 hover:text-blue-600 hover:underline">
                            {a.title}
                          </Link>
                          {a.dueDate && (
                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" />
                              {new Date(a.dueDate).toLocaleDateString("ur-PK")}
                            </p>
                          )}
                        </td>
                        <td className="text-center text-gray-600">{a.maxPoints}</td>
                        <td className="text-center font-bold">
                          {sub?.grade !== null && sub?.grade !== undefined
                            ? sub.grade
                            : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="text-center">
                          {pct !== null
                            ? <span className={`font-bold ${pct >= 80 ? "text-green-600" : pct >= 60 ? "text-yellow-600" : "text-red-600"}`}>{pct}%</span>
                            : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="text-center">
                          {sub?.status === "graded" ? <span className="badge badge-green">جانچا گیا</span> :
                           sub?.status === "late" ? <span className="badge badge-red">دیر سے</span> :
                           sub ? <span className="badge badge-yellow">جمع شدہ</span> :
                           <span className="badge badge-gray">زیر التواء</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {avg !== null && (
                  <tfoot>
                    <tr className="bg-gray-50 font-bold">
                      <td>اوسط</td>
                      <td /><td />
                      <td className={`text-center ${avg >= 80 ? "text-green-600" : avg >= 60 ? "text-yellow-600" : "text-red-600"}`}>
                        {avg}%
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
