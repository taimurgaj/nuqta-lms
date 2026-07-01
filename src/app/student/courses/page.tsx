"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { BookOpen, Users, ClipboardList } from "lucide-react";
import Link from "next/link";

interface CourseData {
  id: string;
  name: string;
  subject: string | null;
  gradeLevel: string;
  description: string;
  teacher: { name: string };
  assignments: Array<{ id: string }>;
}

export default function StudentCourses() {
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/classes")
      .then((r) => r.json())
      .then((data) => setCourses(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout title="میرے اسباق" subtitle={`${courses.length} اسباق میں شامل ہیں`}>
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-700 rounded-full animate-spin" />
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-20">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-bold text-gray-700 mb-2">ابھی کوئی سبق نہیں</h3>
          <p className="text-gray-500">خلاصہ صفحے سے رمز کے ذریعے سبق میں شامل ہوں</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((c) => (
            <Link key={c.id} href={`/student/courses/${c.id}`}>
              <div className="card p-5 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-blue-700" />
                  </div>
                  {c.subject && <span className="badge badge-blue">{c.subject}</span>}
                </div>
                <h3 className="font-bold text-gray-900 mb-1">{c.name}</h3>
                <p className="text-sm text-gray-500 mb-3">جماعت: {c.gradeLevel}</p>
                {c.description && <p className="text-sm text-gray-600 mb-3 line-clamp-2">{c.description}</p>}
                <div className="flex items-center justify-between text-sm text-gray-500 pt-3 border-t border-gray-100">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {c.teacher?.name}
                  </span>
                  <span className="flex items-center gap-1">
                    <ClipboardList className="w-3.5 h-3.5" />
                    {c.assignments?.length || 0} مشقیں
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
