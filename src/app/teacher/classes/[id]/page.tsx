"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { ViewInIdeButton } from "@/components/ViewInIdeButton";
import { Users, Mail, Check, X, Star, Clock, FileText, Brain } from "lucide-react";

interface Student {
  id: string;
  name: string;
  email: string;
}

interface Submission {
  id: string;
  grade: number | null;
  status: string;
  submittedAt: string;
  content: string;
  fileUrl: string | null;
  feedback: string | null;
  student: { name: string };
  assignment: { title: string; maxPoints: number };
}

interface ClassDetail {
  id: string;
  name: string;
  subject: string | null;
  gradeLevel: string;
  code: string;
  enrollments: Array<{ student: Student; joinedAt: string }>;
  assignments: Array<{
    id: string;
    title: string;
    type: string;
    dueDate: string | null;
    maxPoints: number;
    submissions: Submission[];
  }>;
}

export default function ClassDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [cls, setCls] = useState<ClassDetail | null>(null);
  const [tab, setTab] = useState<"roster" | "assignments" | "grades">("roster");
  const [loading, setLoading] = useState(true);
  const [aiHistoryStudent, setAiHistoryStudent] = useState<Student | null>(null);

  useEffect(() => {
    fetch(`/api/classes/${id}`)
      .then((r) => r.json())
      .then(setCls)
      .finally(() => setLoading(false));
  }, [id]);

  async function gradeSubmission(subId: string, assignmentId: string, grade: number, feedback: string) {
    await fetch(`/api/assignments/${assignmentId}/grade`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionId: subId, grade, feedback }),
    });
    // Refresh
    fetch(`/api/classes/${id}`).then((r) => r.json()).then(setCls);
  }

  if (loading) return (
    <DashboardLayout title="سبق لوڈ ہو رہا ہے...">
      <div className="flex items-center justify-center h-40">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-700 rounded-full animate-spin" />
      </div>
    </DashboardLayout>
  );

  if (!cls) return <DashboardLayout title="سبق نہیں ملا"><p className="text-gray-500">یہ سبق موجود نہیں</p></DashboardLayout>;

  return (
    <DashboardLayout title={cls.name} subtitle={`${cls.subject ? `${cls.subject} · ` : ""}جماعت ${cls.gradeLevel} · رمز: ${cls.code}`}>
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 max-w-md">
        {[
          { key: "roster", label: "فہرست طلبہ" },
          { key: "assignments", label: "مشقیں" },
          { key: "grades", label: "نتائج نامہ" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as typeof tab)}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              tab === t.key ? "bg-white text-blue-700 shadow-sm" : "text-gray-600 hover:text-gray-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Student List Tab */}
      {tab === "roster" && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">طلبہ کی فہرست ({cls.enrollments.length})</h2>
          </div>
          {cls.enrollments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>ابھی تک کوئی طالب علم نہیں</p>
              <p className="text-sm mt-1">سبق کا رمز: <strong>{cls.code}</strong></p>
            </div>
          ) : (
            <table className="table-urdu">
              <thead>
                <tr>
                  <th>#</th>
                  <th>نام</th>
                  <th>برقی خط</th>
                  <th>شمولیت کی تاریخ</th>
                  <th>اسائنمنٹ مکمل</th>
                  <th>ذہین معلم</th>
                </tr>
              </thead>
              <tbody>
                {cls.enrollments.map((e, i) => {
                  const studentSubmissions = cls.assignments.flatMap(
                    (a) => a.submissions.filter((s) => s.student.name === e.student.name)
                  );
                  return (
                    <tr key={e.student.id}>
                      <td className="text-gray-500 text-sm">{i + 1}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm">
                            {e.student.name.charAt(0)}
                          </div>
                          <span className="font-medium">{e.student.name}</span>
                        </div>
                      </td>
                      <td className="text-gray-500 text-sm ltr-text">{e.student.email}</td>
                      <td className="text-gray-500 text-sm">{new Date(e.joinedAt).toLocaleDateString("ur-PK")}</td>
                      <td>
                        <span className="badge badge-green">{studentSubmissions.length}/{cls.assignments.length}</span>
                      </td>
                      <td>
                        <button
                          onClick={() => setAiHistoryStudent(e.student)}
                          className="inline-flex items-center gap-1 text-sm text-purple-700 hover:underline"
                        >
                          <Brain className="w-3.5 h-3.5" />
                          تاریخ دیکھیں
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Assignments Tab */}
      {tab === "assignments" && (
        <div className="space-y-4">
          {cls.assignments.length === 0 ? (
            <div className="card text-center py-12 text-gray-500">
              <p>اس سبق کے لیے ابھی کوئی مشق نہیں</p>
            </div>
          ) : (
            cls.assignments.map((a) => (
              <div key={a.id} className="card p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900">{a.title}</h3>
                    {a.dueDate && (
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <Clock className="w-3.5 h-3.5" />
                        آخری تاریخ: {new Date(a.dueDate).toLocaleDateString("ur-PK")}
                      </p>
                    )}
                  </div>
                  <span className="badge badge-blue">{a.submissions.length} جمع شدہ</span>
                </div>

                {a.submissions.length > 0 && (
                  <div className="mt-4 overflow-x-auto">
                    <table className="table-urdu">
                      <thead>
                        <tr>
                          <th>طالب علم</th>
                          <th>صورتحال</th>
                          <th>پوائنٹس</th>
                          <th>عمل</th>
                        </tr>
                      </thead>
                      <tbody>
                        {a.submissions.map((s) => (
                          <GradeRow key={s.id} submission={s} maxPoints={s.assignment?.maxPoints || 100} assignmentType={a.type} onGrade={(grade, feedback) => gradeSubmission(s.id, a.id, grade, feedback)} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Results Tab */}
      {tab === "grades" && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">نتائج نامہ</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="table-urdu">
              <thead>
                <tr>
                  <th>طالب علم</th>
                  {cls.assignments.map((a) => (
                    <th key={a.id} className="max-w-24 truncate">
                      <Link href={`/teacher/assignments?highlight=${a.id}`} className="hover:text-blue-600 hover:underline" title={a.title}>
                        {a.title}
                      </Link>
                    </th>
                  ))}
                  <th>اوسط</th>
                </tr>
              </thead>
              <tbody>
                {cls.enrollments.map((e) => {
                  const grades = cls.assignments.map((a) =>
                    a.submissions.find((s) => s.student.name === e.student.name)?.grade ?? null
                  );
                  const validGrades = grades.filter((g) => g !== null) as number[];
                  const avg = validGrades.length > 0 ? Math.round(validGrades.reduce((a, b) => a + b, 0) / validGrades.length) : null;
                  return (
                    <tr key={e.student.id}>
                      <td className="font-medium">{e.student.name}</td>
                      {grades.map((g, i) => (
                        <td key={i} className="text-center">
                          {g !== null ? (
                            <span className={`font-bold ${g >= 80 ? "text-green-600" : g >= 60 ? "text-yellow-600" : "text-red-600"}`}>
                              {g}%
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                      ))}
                      <td className="text-center">
                        {avg !== null ? <span className="badge badge-blue">{avg}%</span> : <span className="text-gray-300">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {aiHistoryStudent && (
        <AIHistoryModal student={aiHistoryStudent} onClose={() => setAiHistoryStudent(null)} />
      )}
    </DashboardLayout>
  );
}

interface AIMessageRow {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

function AIHistoryModal({ student, onClose }: { student: Student; onClose: () => void }) {
  const [messages, setMessages] = useState<AIMessageRow[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/students/${student.id}/ai-history`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setMessages(data);
        else setError(data.error || "کچھ غلط ہوا");
      });
  }, [student.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">{student.name} — ذہین معلم کی تاریخ</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {error && <p className="text-red-600 text-sm">{error}</p>}
          {!error && messages === null && (
            <div className="flex items-center justify-center h-24">
              <div className="w-6 h-6 border-4 border-blue-200 border-t-blue-700 rounded-full animate-spin" />
            </div>
          )}
          {messages?.length === 0 && <p className="text-gray-500 text-sm text-center py-8">اس طالب علم نے ابھی تک ذہین معلم سے بات نہیں کی</p>}
          {messages?.map((m) => (
            <div key={m.id} className={m.role === "user" ? "chat-bubble-user" : "chat-bubble-ai"}>
              <p className="text-sm whitespace-pre-wrap">{m.content}</p>
              <p className="text-xs opacity-60 mt-1">{new Date(m.createdAt).toLocaleString("ur-PK")}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GradeRow({ submission, maxPoints, assignmentType, onGrade }: { submission: Submission; maxPoints: number; assignmentType: string; onGrade: (g: number, f: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [grade, setGrade] = useState(submission.grade?.toString() || "");
  const [feedback, setFeedback] = useState(submission.feedback || "");

  return (
    <>
      <tr>
        <td className="font-medium">{submission.student.name}</td>
        <td>
          {submission.status === "graded" ? (
            <span className="badge badge-green flex items-center gap-1"><Check className="w-3 h-3" />جانچا گیا</span>
          ) : submission.status === "late" ? (
            <span className="badge badge-red">دیر سے</span>
          ) : (
            <span className="badge badge-yellow">جمع شدہ</span>
          )}
        </td>
        <td>
          {editing ? (
            <input type="number" className="input-urdu w-20 text-center ltr-text" min="0" max={maxPoints} value={grade} onChange={(e) => setGrade(e.target.value)} />
          ) : (
            <span className="font-bold">{submission.grade !== null ? `${submission.grade}/${maxPoints}` : "—"}</span>
          )}
        </td>
        <td>
          {editing ? (
            <div className="flex gap-2 items-center">
              <button onClick={() => { onGrade(parseFloat(grade), feedback); setEditing(false); }} className="text-green-600 hover:text-green-700"><Check className="w-4 h-4" /></button>
              <button onClick={() => setEditing(false)} className="text-gray-400"><X className="w-4 h-4" /></button>
            </div>
          ) : (
            <button onClick={() => setEditing(true)} className="text-blue-600 text-sm hover:underline flex items-center gap-1">
              <Star className="w-3.5 h-3.5" />
              {submission.grade !== null ? "تبدیل کریں" : "پوائنٹس دیں"}
            </button>
          )}
        </td>
      </tr>
      {/* Submission content row */}
      {(submission.content || submission.fileUrl) && (
        <tr className="bg-gray-50">
          <td colSpan={4} className="px-4 py-2">
            {submission.content && (assignmentType === "ide" || assignmentType === "code") && (
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-xs text-gray-600 whitespace-pre-wrap max-h-20 overflow-y-auto flex-1" dir="ltr">{submission.content}</p>
                <ViewInIdeButton code={submission.content} studentName={submission.student.name} />
              </div>
            )}
            {submission.content && assignmentType !== "ide" && assignmentType !== "code" && (
              <p className="text-xs text-gray-600 whitespace-pre-wrap max-h-20 overflow-y-auto" dir="auto">{submission.content}</p>
            )}
            {submission.fileUrl && (
              <a href={submission.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1">
                <FileText className="w-3 h-3" />
                دستاویز دیکھیں
              </a>
            )}
          </td>
        </tr>
      )}
      {/* Feedback input row when editing */}
      {editing && (
        <tr className="bg-blue-50">
          <td colSpan={4} className="px-4 py-2">
            <textarea
              className="input-urdu text-sm w-full"
              rows={2}
              placeholder="تبصرہ (اختیاری)"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
          </td>
        </tr>
      )}
      {/* Show saved feedback */}
      {!editing && submission.feedback && (
        <tr className="bg-blue-50">
          <td colSpan={4} className="px-4 py-2 text-xs text-blue-700">
            <span className="font-medium">تبصرہ: </span>{submission.feedback}
          </td>
        </tr>
      )}
    </>
  );
}
