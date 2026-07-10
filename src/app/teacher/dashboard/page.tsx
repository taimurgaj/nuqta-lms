"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Users, BookOpen, ClipboardList, TrendingUp, Plus, CheckCircle, Clock, AlertCircle } from "lucide-react";
import Link from "next/link";

interface AnalyticsData {
  totalClasses: number;
  totalStudents: number;
  totalAssignments: number;
  totalSubmissions: number;
  avgGrade: number;
  submissionRate: number;
  recentActivity: Array<{
    student: string;
    assignment: string;
    grade: number | null;
    status: string;
    date: string;
  }>;
  classStats: Array<{
    id: string;
    name: string;
    students: number;
    assignments: number;
    submissions: number;
  }>;
}

function StatusIcon({ status }: { status: string }) {
  if (status === "graded") return <CheckCircle className="w-4 h-4 text-green-500" />;
  if (status === "late") return <AlertCircle className="w-4 h-4 text-red-500" />;
  return <Clock className="w-4 h-4 text-yellow-500" />;
}

function StatusLabel({ status }: { status: string }) {
  if (status === "graded") return <span className="badge badge-green">جانچا گیا</span>;
  if (status === "late") return <span className="badge badge-red">دیر سے</span>;
  return <span className="badge badge-yellow">جمع شدہ</span>;
}

export default function TeacherDashboard() {
  const { data: session } = useSession();
  const u = session?.user as { isOrgAdmin?: boolean } | undefined;
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then(setAnalytics)
      .finally(() => setLoading(false));
  }, []);

  const stats = analytics
    ? [
        { label: "کل اسباق", value: analytics.totalClasses, icon: <BookOpen className="w-5 h-5" />, color: "bg-blue-100 text-blue-700" },
        { label: "کل طلبہ", value: analytics.totalStudents, icon: <Users className="w-5 h-5" />, color: "bg-green-100 text-green-700" },
        { label: "کل مشقیں", value: analytics.totalAssignments, icon: <ClipboardList className="w-5 h-5" />, color: "bg-orange-100 text-orange-700" },
        { label: "اوسط پوائنٹس", value: `${analytics.avgGrade}%`, icon: <TrendingUp className="w-5 h-5" />, color: "bg-purple-100 text-purple-700" },
      ]
    : [];

  return (
    <DashboardLayout
      title={u?.isOrgAdmin ? "منتظم کا خلاصہ" : "استاد کا خلاصہ"}
      subtitle="آپ کے اسباق اور طلبہ کا جائزہ"
      actions={
        u?.isOrgAdmin ? (
          <Link href="/teacher/org" className="btn-primary text-sm">
            <Plus className="w-4 h-4" />
            نیا سبق
          </Link>
        ) : undefined
      }
    >
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-700 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((s) => (
              <div key={s.label} className="stat-card">
                <div className={`stat-icon ${s.color}`}>{s.icon}</div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                  <p className="text-sm text-gray-500">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900">اسباق کا خلاصہ</h2>
                <Link href="/teacher/classes" className="text-sm text-blue-600 hover:underline">تمام دیکھیں</Link>
              </div>
              {analytics?.classStats?.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p>ابھی تک کوئی سبق نہیں</p>
                  {u?.isOrgAdmin && <Link href="/teacher/org" className="text-blue-600 text-sm hover:underline">پہلا سبق بنائیں</Link>}
                </div>
              ) : (
                <div className="space-y-3">
                  {analytics?.classStats?.map((c) => (
                    <Link key={c.id} href={`/teacher/classes/${c.id}`} className="block">
                      <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                            <BookOpen className="w-4 h-4 text-blue-700" />
                          </div>
                          <div>
                            <p className="font-medium text-sm text-gray-900">{c.name}</p>
                            <p className="text-xs text-gray-500">{c.students} طلبہ · {c.assignments} مشقیں</p>
                          </div>
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-green-600">{c.submissions}</p>
                          <p className="text-xs text-gray-400">جمع شدہ</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900">حالیہ سرگرمی</h2>
                <Link href="/teacher/assignments" className="text-sm text-blue-600 hover:underline">تمام دیکھیں</Link>
              </div>
              {analytics?.recentActivity?.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ClipboardList className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p>کوئی حالیہ سرگرمی نہیں</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {analytics?.recentActivity?.map((a, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100">
                      <StatusIcon status={a.status} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{a.student}</p>
                        <p className="text-xs text-gray-500 truncate">{a.assignment}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {a.grade !== null && (
                          <span className="text-sm font-bold text-gray-700">{a.grade}%</span>
                        )}
                        <StatusLabel status={a.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { href: "/teacher/classes", label: "اسباق منظم کریں", icon: <Users className="w-5 h-5" />, color: "bg-sky-50 text-sky-700 border-sky-200" },
              { href: "/teacher/assignments", label: "مشق بنائیں", icon: <ClipboardList className="w-5 h-5" />, color: "bg-orange-50 text-orange-700 border-orange-200" },
              { href: "/teacher/curriculum", label: "کتب خانہ", icon: <BookOpen className="w-5 h-5" />, color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
              { href: "/teacher/analytics", label: "تفصیلی جائزہ", icon: <TrendingUp className="w-5 h-5" />, color: "bg-purple-50 text-purple-700 border-purple-200" },
            ].map((item) => (
              <Link key={item.href} href={item.href} className={`card p-4 flex items-center gap-3 hover:shadow-md transition-shadow border ${item.color}`}>
                {item.icon}
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
