"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { BookOpen, ClipboardList, Clock, CheckCircle, Brain, Plus, X } from "lucide-react";
import Link from "next/link";

interface Assignment {
  id: string;
  title: string;
  dueDate: string | null;
  class: { name: string };
  submissions: Array<{ grade: number | null; status: string }>;
}

interface ClassData {
  id: string;
  name: string;
  subject: string | null;
  teacher: { name: string };
}

export default function StudentDashboard() {
  const { data: session } = useSession();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinMsg, setJoinMsg] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/assignments").then((r) => r.json().catch(() => [])),
      fetch("/api/classes").then((r) => r.json().catch(() => [])),
    ]).then(([a, c]) => {
      setAssignments(Array.isArray(a) ? a : []);
      setClasses(Array.isArray(c) ? c : []);
    }).finally(() => setLoading(false));
  }, []);

  async function joinClass(e: React.FormEvent) {
    e.preventDefault();
    setJoining(true);
    setJoinMsg("");
    const res = await fetch("/api/classes/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    setJoinMsg(data.message || data.error || "");
    if (res.ok) {
      setCode("");
      setTimeout(() => {
        setShowJoinModal(false);
        setJoinMsg("");
        fetch("/api/classes").then((r) => r.json()).then(setClasses);
      }, 1500);
    }
    setJoining(false);
  }

  const pending = assignments.filter((a) => !a.submissions.length);
  const completed = assignments.filter((a) => a.submissions.length > 0);

  return (
    <DashboardLayout
      title={`السلام علیکم، ${session?.user?.name?.split(" ")[0] || "طالب علم"}!`}
      subtitle="آپ کی تعلیمی پیشرفت کا جائزہ"
      actions={
        <button onClick={() => setShowJoinModal(true)} className="btn-primary text-sm">
          <Plus className="w-4 h-4" />
          سبق میں شامل ہوں
        </button>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-700 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "اسباق", value: classes.length, icon: <BookOpen className="w-5 h-5" />, color: "bg-blue-100 text-blue-700" },
              { label: "زیر التواء مشقیں", value: pending.length, icon: <Clock className="w-5 h-5" />, color: "bg-yellow-100 text-yellow-700" },
              { label: "مکمل مشقیں", value: completed.length, icon: <CheckCircle className="w-5 h-5" />, color: "bg-green-100 text-green-700" },
              { label: "کل مشقیں", value: assignments.length, icon: <ClipboardList className="w-5 h-5" />, color: "bg-purple-100 text-purple-700" },
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
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900">میرے اسباق</h2>
                <button onClick={() => setShowJoinModal(true)} className="text-sm text-blue-600 hover:underline">+ سبق میں شامل ہوں</button>
              </div>
              {classes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p className="mb-2">ابھی کوئی سبق نہیں</p>
                  <button onClick={() => setShowJoinModal(true)} className="text-blue-600 text-sm hover:underline">رمز سے سبق میں شامل ہوں</button>
                </div>
              ) : (
                <div className="space-y-2">
                  {classes.slice(0, 5).map((c) => (
                    <Link key={c.id} href={`/student/courses/${c.id}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 border border-gray-100 transition-colors">
                      <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-4 h-4 text-blue-700" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-900">{c.name}</p>
                        <p className="text-xs text-gray-500">{c.subject ? `${c.subject} · ` : ""}{c.teacher?.name}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900">زیر التواء مشقیں</h2>
                <Link href="/student/assignments" className="text-sm text-blue-600 hover:underline">تمام دیکھیں</Link>
              </div>
              {pending.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-300" />
                  <p>تمام مشقیں مکمل ہیں!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pending.slice(0, 5).map((a) => (
                    <Link key={a.id} href="/student/assignments" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 border border-gray-100 transition-colors">
                      <div className="w-9 h-9 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <ClipboardList className="w-4 h-4 text-orange-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 truncate">{a.title}</p>
                        <p className="text-xs text-gray-500">{a.class.name}</p>
                      </div>
                      {a.dueDate && (
                        <div className="text-left flex-shrink-0">
                          <p className="text-xs text-red-500 font-medium">{new Date(a.dueDate).toLocaleDateString("ur-PK")}</p>
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <Link href="/student/ai-tutor" className="card p-5 flex items-center gap-4 hover:shadow-md transition-shadow bg-gradient-to-br from-purple-50 to-white">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-purple-700" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">ذہین معلم سے بات کریں</h3>
                <p className="text-sm text-gray-500">اردو مصنوعی ذہانت کا معلم</p>
              </div>
            </Link>
          </div>
        </div>
      )}

      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" dir="rtl">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">سبق میں شامل ہوں</h2>
              <button onClick={() => { setShowJoinModal(false); setJoinMsg(""); }}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={joinClass} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">سبق کا رمز</label>
                <input
                  className="input-urdu text-center font-mono text-lg tracking-widest uppercase"
                  placeholder="XXXXXX"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  required
                />
                <p className="text-xs text-gray-400 mt-1">استاد سے ۶ حرفی رمز لیں</p>
              </div>
              {joinMsg && (
                <div className={`rounded-lg px-4 py-3 text-sm ${joinMsg.includes("شدہ") || joinMsg.includes("گئے") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                  {joinMsg}
                </div>
              )}
              <button type="submit" disabled={joining || code.length < 6} className="btn-primary w-full justify-center py-2.5">
                {joining ? "شامل ہو رہے ہیں..." : "شامل ہوں"}
              </button>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
