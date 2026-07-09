"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { TrendingUp, Users, BookOpen, ClipboardList, CheckCircle, Clock, AlertCircle } from "lucide-react";

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
    assignmentId: string;
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

export default function TeacherAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <DashboardLayout title="تجزیہ">
      <div className="flex items-center justify-center h-40">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-700 rounded-full animate-spin" />
      </div>
    </DashboardLayout>
  );

  const submissionStatusData = data ? [
    { name: "جانچا گیا", value: data.recentActivity.filter((a) => a.status === "graded").length, color: "#059669" },
    { name: "جمع شدہ", value: data.recentActivity.filter((a) => a.status === "submitted").length, color: "#1e40af" },
    { name: "دیر سے", value: data.recentActivity.filter((a) => a.status === "late").length, color: "#dc2626" },
  ].filter((d) => d.value > 0) : [];

  const classChartData = data?.classStats?.map((c) => ({
    name: c.name.length > 16 ? c.name.slice(0, 16) + "…" : c.name,
    fullName: c.name,
    طلبہ: c.students,
    جمع: c.submissions,
  })) || [];

  return (
    <DashboardLayout title="تجزیاتی جائزہ" subtitle="آپ کی جماعتوں کی مکمل کارکردگی">
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "کل جماعتیں", value: data?.totalClasses || 0, icon: <BookOpen className="w-5 h-5" />, color: "bg-blue-100 text-blue-700" },
            { label: "کل طلبہ", value: data?.totalStudents || 0, icon: <Users className="w-5 h-5" />, color: "bg-green-100 text-green-700" },
            { label: "اوسط پوائنٹس", value: `${data?.avgGrade || 0}%`, icon: <TrendingUp className="w-5 h-5" />, color: "bg-purple-100 text-purple-700" },
            { label: "جمع کرانے کی شرح", value: `${data?.submissionRate || 0}%`, icon: <ClipboardList className="w-5 h-5" />, color: "bg-orange-100 text-orange-700" },
          ].map((s) => (
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
            <h3 className="font-bold text-gray-900 mb-5">جماعت وار تجزیہ</h3>
            {classChartData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-gray-400">ابھی کوئی معلومات نہیں</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={classChartData} margin={{ top: 0, right: 10, left: -20, bottom: 32 }} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName ?? ""}
                    contentStyle={{ direction: "rtl", fontFamily: "var(--font-urdu), serif" }}
                  />
                  <Legend wrapperStyle={{ fontFamily: "var(--font-urdu), serif", fontSize: 12 }} />
                  <Bar dataKey="طلبہ" fill="#1e40af" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="جمع" fill="#059669" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="card p-5">
            <h3 className="font-bold text-gray-900 mb-5">مشقوں کی صورتحال</h3>
            {submissionStatusData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-gray-400">ابھی کوئی معلومات نہیں</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={submissionStatusData}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={90}
                    dataKey="value"
                    paddingAngle={2}
                    label={({ percent }: { percent?: number }) => `${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {submissionStatusData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ direction: "rtl", fontFamily: "var(--font-urdu), serif" }} />
                  <Legend
                    verticalAlign="bottom"
                    wrapperStyle={{ fontFamily: "var(--font-urdu), serif", fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900">حالیہ سرگرمی</h3>
          </div>
          {!data?.recentActivity?.length ? (
            <div className="p-8 text-center text-gray-500">کوئی حالیہ سرگرمی نہیں</div>
          ) : (
            <table className="table-urdu">
              <thead>
                <tr>
                  <th>طالب علم</th>
                  <th>مشق</th>
                  <th>پوائنٹس</th>
                  <th>صورتحال</th>
                  <th>تاریخ</th>
                </tr>
              </thead>
              <tbody>
                {data.recentActivity.map((a, i) => (
                  <tr key={i}>
                    <td className="font-medium">{a.student}</td>
                    <td>
                      <Link href={`/teacher/assignments?highlight=${a.assignmentId}`} className="text-gray-600 hover:text-blue-600 hover:underline">
                        {a.assignment}
                      </Link>
                    </td>
                    <td>
                      {a.grade !== null ? (
                        <span className={`font-bold ${a.grade >= 80 ? "text-green-600" : a.grade >= 60 ? "text-yellow-600" : "text-red-600"}`}>
                          {a.grade}%
                        </span>
                      ) : "—"}
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        {a.status === "graded" ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> :
                         a.status === "late" ? <AlertCircle className="w-3.5 h-3.5 text-red-500" /> :
                         <Clock className="w-3.5 h-3.5 text-yellow-500" />}
                        <span className="text-sm">
                          {a.status === "graded" ? "جانچا گیا" : a.status === "late" ? "دیر سے" : "جمع شدہ"}
                        </span>
                      </div>
                    </td>
                    <td className="text-gray-500 text-sm">{new Date(a.date).toLocaleDateString("ur-PK")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900">جماعت وار پیشرفت</h3>
          </div>
          <table className="table-urdu">
            <thead>
              <tr>
                <th>جماعت</th>
                <th>طلبہ</th>
                <th>مشقیں</th>
                <th>جمع شدہ</th>
                <th>جمع کرانے کی شرح</th>
              </tr>
            </thead>
            <tbody>
              {data?.classStats?.map((c) => {
                const rate = c.assignments > 0 && c.students > 0
                  ? Math.round((c.submissions / (c.assignments * c.students)) * 100)
                  : 0;
                return (
                  <tr key={c.id}>
                    <td className="font-medium">
                      <Link href={`/teacher/classes/${c.id}`} className="hover:text-blue-600 hover:underline">
                        {c.name}
                      </Link>
                    </td>
                    <td>{c.students}</td>
                    <td>{c.assignments}</td>
                    <td>{c.submissions}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-2 max-w-20">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${rate}%` }} />
                        </div>
                        <span className="text-sm font-medium text-gray-700">{rate}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
