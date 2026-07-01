"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
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

const COLORS = ["#1e40af", "#059669", "#d97706", "#7c3aed", "#dc2626"];

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
    name: c.name.length > 10 ? c.name.slice(0, 10) + "..." : c.name,
    طلبہ: c.students,
    مشقیں: c.assignments,
    جمع: c.submissions,
  })) || [];

  return (
    <DashboardLayout title="تجزیاتی جائزہ" subtitle="آپ کی جماعتوں کی مکمل کارکردگی">
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "کل جماعتیں", value: data?.totalClasses || 0, icon: <BookOpen className="w-5 h-5" />, color: "bg-blue-100 text-blue-700" },
            { label: "کل طلبہ", value: data?.totalStudents || 0, icon: <Users className="w-5 h-5" />, color: "bg-green-100 text-green-700" },
            { label: "اوسط نمبر", value: `${data?.avgGrade || 0}%`, icon: <TrendingUp className="w-5 h-5" />, color: "bg-purple-100 text-purple-700" },
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
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={classChartData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
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
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={submissionStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    dataKey="value"
                    label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {submissionStatusData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
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
                  <th>نمبر</th>
                  <th>صورتحال</th>
                  <th>تاریخ</th>
                </tr>
              </thead>
              <tbody>
                {data.recentActivity.map((a, i) => (
                  <tr key={i}>
                    <td className="font-medium">{a.student}</td>
                    <td className="text-gray-600">{a.assignment}</td>
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
                    <td className="font-medium">{c.name}</td>
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
