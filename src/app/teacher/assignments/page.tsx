"use client";

import { useEffect, useState, useRef } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Plus, ClipboardList, Clock, Users, Eye, X, Send, FileText, Award, Check, Code2 } from "lucide-react";

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string | null;
  maxPoints: number;
  type: string;
  isPublished: boolean;
  class: { name: string };
  submissions: Array<{ id: string; grade: number | null; status: string; content: string; fileUrl: string | null; feedback: string | null; submittedAt: string; student: { name: string } }>;
}

interface ClassOption {
  id: string;
  name: string;
}

const TYPE_LABELS: Record<string, string> = {
  written: "تحریری",
  code: "رمز نویسی",
  quiz: "آزمائش",
  ide: "کوڈ گاہ",
  other: "دیگر",
};

const PRESET_TYPES = [
  { key: "pdf",   label: "پی ڈی ایف" },
  { key: "image", label: "تصویر" },
  { key: "zip",   label: "زپ" },
  { key: "word",  label: "ورڈ" },
  { key: "txt",   label: "سادہ متن" },
];

export default function TeacherAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [customExtInput, setCustomExtInput] = useState("");
  const customExtRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: "", description: "", classId: "", dueDate: "", maxPoints: "100",
    type: "written", isPublished: false, allowedFileTypes: [] as string[],
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/assignments").then((r) => r.json()),
      fetch("/api/classes").then((r) => r.json()),
    ]).then(([a, c]) => {
      setAssignments(a);
      setClasses(c);
    }).finally(() => setLoading(false));
  }, []);

  async function createAssignment(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, maxPoints: parseInt(form.maxPoints), allowedFileTypes: form.allowedFileTypes }),
    });
    const data = await res.json();
    if (res.ok) {
      const cls = classes.find((c) => c.id === form.classId);
      setAssignments((prev) => [{ ...data, class: { name: cls?.name || "" }, submissions: [] }, ...prev]);
      setShowModal(false);
      resetForm();
    }
    setSaving(false);
  }

  function resetForm() {
    setForm({ title: "", description: "", classId: "", dueDate: "", maxPoints: "100", type: "written", isPublished: false, allowedFileTypes: [] });
    setCustomExtInput("");
  }

  async function togglePublish(id: string, current: boolean) {
    await fetch(`/api/assignments/${id}/publish`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !current }),
    });
    setAssignments((prev) => prev.map((a) => a.id === id ? { ...a, isPublished: !current } : a));
  }

  function togglePreset(key: string) {
    setForm((f) => ({
      ...f,
      allowedFileTypes: f.allowedFileTypes.includes(key)
        ? f.allowedFileTypes.filter((t) => t !== key)
        : [...f.allowedFileTypes, key],
    }));
  }

  function addCustomExt() {
    let ext = customExtInput.trim().toLowerCase();
    if (!ext) return;
    if (!ext.startsWith(".")) ext = "." + ext;
    if (!form.allowedFileTypes.includes(ext)) {
      setForm((f) => ({ ...f, allowedFileTypes: [...f.allowedFileTypes, ext] }));
    }
    setCustomExtInput("");
    customExtRef.current?.focus();
  }

  function removeFileType(key: string) {
    setForm((f) => ({ ...f, allowedFileTypes: f.allowedFileTypes.filter((t) => t !== key) }));
  }

  async function gradeSubmission(assignmentId: string, subId: string, grade: number, feedback: string) {
    await fetch(`/api/assignments/${assignmentId}/grade`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionId: subId, grade, feedback }),
    });
    setAssignments((prev) =>
      prev.map((a) =>
        a.id === assignmentId
          ? { ...a, submissions: a.submissions.map((s) => s.id === subId ? { ...s, grade, feedback, status: "graded" } : s) }
          : a
      )
    );
  }

  const viewedAssignment = assignments.find((a) => a.id === viewId);

  return (
    <DashboardLayout
      title="مشقیں"
      subtitle={`${assignments.length} مشقیں`}
      actions={
        <button onClick={() => setShowModal(true)} className="btn-primary text-sm">
          <Plus className="w-4 h-4" />
          نئی مشق
        </button>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-700 rounded-full animate-spin" />
        </div>
      ) : assignments.length === 0 ? (
        <div className="text-center py-20">
          <ClipboardList className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-bold text-gray-700 mb-2">کوئی مشق نہیں</h3>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus className="w-4 h-4" />
            پہلی مشق بنائیں
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => (
            <div key={a.id} className="card p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <ClipboardList className="w-5 h-5 text-orange-700" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-gray-900">{a.title}</h3>
                  <span className="badge badge-blue">{TYPE_LABELS[a.type] || a.type}</span>
                  {a.isPublished ? (
                    <span className="badge badge-green">شائع</span>
                  ) : (
                    <span className="badge badge-gray">مسودہ</span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                  <span>{a.class.name}</span>
                  {a.dueDate && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(a.dueDate).toLocaleDateString("ur-PK")}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {a.submissions.length} جمع شدہ
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => setViewId(a.id)} className="btn-secondary text-sm py-1.5 px-3">
                  <Eye className="w-3.5 h-3.5" />
                  جمع شدہ کام
                </button>
                <button
                  onClick={() => togglePublish(a.id, a.isPublished)}
                  className={`text-sm py-1.5 px-3 rounded-lg font-medium border transition-all ${
                    a.isPublished
                      ? "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"
                      : "bg-green-100 text-green-700 border-green-200 hover:bg-green-200"
                  }`}
                >
                  {a.isPublished ? "غیر شائع" : "شائع کریں"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" dir="rtl">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">نئی مشق بنائیں</h2>
              <button onClick={() => { setShowModal(false); resetForm(); }}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={createAssignment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">عنوان *</label>
                <input className="input-urdu" placeholder="مشق کا نام" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ہدایات *</label>
                <textarea className="input-urdu" rows={3} placeholder="طلبہ کے لیے ہدایات..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">جماعت *</label>
                  <select className="input-urdu" value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })} required>
                    <option value="">منتخب کریں</option>
                    {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">قسم</label>
                  <select className="input-urdu" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    {Object.entries(TYPE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">آخری تاریخ</label>
                  <input type="datetime-local" className="input-urdu ltr-text" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">کل نمبر</label>
                  <input type="number" className="input-urdu ltr-text" value={form.maxPoints} onChange={(e) => setForm({ ...form, maxPoints: e.target.value })} min="1" max="1000" />
                </div>
              </div>

              {/* File upload permissions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  دستاویز منسلک کرنے کی اجازت <span className="text-gray-400 font-normal">(اختیاری)</span>
                </label>

                {/* Preset quick-add buttons */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {PRESET_TYPES.map((opt) => {
                    const active = form.allowedFileTypes.includes(opt.key);
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => togglePreset(opt.key)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                          active
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>

                {/* Custom extension input */}
                <div className="flex gap-2">
                  <input
                    ref={customExtRef}
                    type="text"
                    className="input-urdu flex-1 ltr-text text-sm"
                    placeholder=".وردو یا .java یا .mp4"
                    value={customExtInput}
                    onChange={(e) => setCustomExtInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomExt(); } }}
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={addCustomExt}
                    className="btn-secondary text-sm px-4 flex-shrink-0"
                  >
                    شامل کریں
                  </button>
                </div>

                {/* Active file types as removable tags */}
                {form.allowedFileTypes.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {form.allowedFileTypes.map((t) => {
                      const label = t.startsWith(".") ? t : (PRESET_TYPES.find((p) => p.key === t)?.label ?? t);
                      return (
                        <span key={t} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-lg text-sm">
                          {label}
                          <button type="button" onClick={() => removeFileType(t)} className="text-blue-400 hover:text-blue-700">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
                {form.allowedFileTypes.length === 0 && (
                  <p className="text-xs text-gray-400 mt-2">کوئی انتخاب نہیں — دستاویز منسلک کرنا بند رہے گا</p>
                )}
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} className="w-4 h-4 rounded" />
                <span className="text-sm font-medium text-gray-700">ابھی شائع کریں</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center py-2.5">
                  <Send className="w-4 h-4" />
                  {saving ? "بن رہی ہے..." : "مشق بنائیں"}
                </button>
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="btn-secondary px-5">منسوخ</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Submissions Modal */}
      {viewId && viewedAssignment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" dir="rtl">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-gray-900">{viewedAssignment.title}</h2>
              <button onClick={() => setViewId(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <p className="text-sm text-gray-500 mb-5">{viewedAssignment.submissions.length} جمع شدہ · کل نمبر: {viewedAssignment.maxPoints}</p>
            {viewedAssignment.submissions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">ابھی کوئی جمع نہیں کیا</p>
            ) : (
              <div className="space-y-4">
                {viewedAssignment.submissions.map((s) => (
                  <SubmissionCard
                    key={s.id}
                    sub={s}
                    maxPoints={viewedAssignment.maxPoints}
                    assignmentType={viewedAssignment.type}
                    onGrade={(grade, feedback) => gradeSubmission(viewedAssignment.id, s.id, grade, feedback)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

type SubType = { id: string; grade: number | null; status: string; content: string; fileUrl: string | null; feedback: string | null; submittedAt: string; student: { name: string } };

function SubmissionCard({ sub, maxPoints, assignmentType, onGrade }: { sub: SubType; maxPoints: number; assignmentType: string; onGrade: (g: number, f: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [grade, setGrade] = useState(sub.grade?.toString() || "");
  const [feedback, setFeedback] = useState(sub.feedback || "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await onGrade(parseFloat(grade), feedback);
    setSaving(false);
    setEditing(false);
  }

  return (
    <div className="border border-gray-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-bold text-gray-900">{sub.student.name}</p>
        <div className="flex items-center gap-2">
          {sub.grade !== null && <span className="badge badge-blue">{sub.grade}/{maxPoints}</span>}
          <span className={`badge ${sub.status === "graded" ? "badge-green" : sub.status === "late" ? "badge-red" : "badge-yellow"}`}>
            {sub.status === "graded" ? "جانچا گیا" : sub.status === "late" ? "دیر سے" : "جمع شدہ"}
          </span>
        </div>
      </div>

      <p className="text-xs text-gray-400">{new Date(sub.submittedAt).toLocaleDateString("ur-PK")}</p>

      {sub.content && (
        assignmentType === "ide" || assignmentType === "code" ? (
          <div>
            <p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><Code2 className="w-3 h-3" />جمع کیا گیا کوڈ</p>
            <pre className="font-mono text-xs bg-gray-900 text-green-300 rounded-lg p-3 max-h-48 overflow-y-auto whitespace-pre-wrap" dir="ltr">
              {sub.content}
            </pre>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 whitespace-pre-wrap max-h-40 overflow-y-auto" dir="auto">
            {sub.content}
          </div>
        )
      )}

      {sub.fileUrl && (
        <a href={sub.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
          <FileText className="w-3.5 h-3.5" />
          دستاویز دیکھیں
        </a>
      )}

      {sub.feedback && !editing && (
        <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
          <span className="font-medium">تبصرہ: </span>{sub.feedback}
        </div>
      )}

      {editing ? (
        <div className="space-y-2 border-t border-gray-100 pt-3">
          <div className="flex items-center gap-2">
            <input
              type="number" min="0" max={maxPoints}
              className="input-urdu w-24 ltr-text text-center"
              placeholder="نمبر"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
            />
            <span className="text-sm text-gray-500">/ {maxPoints}</span>
          </div>
          <textarea
            className="input-urdu text-sm"
            rows={2}
            placeholder="تبصرہ (اختیاری)"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
          <div className="flex gap-2">
            <button onClick={save} disabled={saving || !grade} className="btn-primary text-sm py-1.5 px-4 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              {saving ? "محفوظ..." : "محفوظ کریں"}
            </button>
            <button onClick={() => setEditing(false)} className="btn-secondary text-sm py-1.5 px-3">منسوخ</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setEditing(true)} className="text-blue-600 text-sm hover:underline flex items-center gap-1">
          <Award className="w-3.5 h-3.5" />
          {sub.grade !== null ? "نمبر تبدیل کریں" : "نمبر دیں"}
        </button>
      )}
    </div>
  );
}
