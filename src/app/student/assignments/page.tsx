"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { ClipboardList, Clock, CheckCircle, AlertCircle, Send, X, ChevronDown, ChevronUp, Paperclip, FileText, Code2 } from "lucide-react";

interface Submission {
  grade: number | null;
  status: string;
  submittedAt: string;
  feedback?: string;
  fileUrl?: string;
  content?: string;
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string | null;
  maxPoints: number;
  type: string;
  allowedFileTypes: string;
  class: { name: string };
  submissions: Submission[];
}

const FILE_TYPE_ACCEPT: Record<string, string> = {
  pdf:   ".pdf",
  image: ".jpg,.jpeg,.png,.gif,.webp",
  zip:   ".zip",
  word:  ".doc,.docx",
  txt:   ".txt",
};

const FILE_TYPE_LABEL: Record<string, string> = {
  pdf: "پی ڈی ایف", image: "تصویر", zip: "زپ", word: "ورڈ", txt: "سادہ متن",
};

export default function StudentAssignments() {
  const { data: session } = useSession();
  const studentName = (session?.user as { name?: string })?.name ?? "";

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitId, setSubmitId] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // IDE iframe + postMessage code extraction
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const codeResolverRef = useRef<((code: string) => void) | null>(null);

  useEffect(() => {
    fetch("/api/assignments")
      .then((r) => r.json())
      .then((data) => setAssignments(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  // Deep-link support: /student/assignments?highlight=<id> expands and scrolls to that exercise
  useEffect(() => {
    if (!assignments.length) return;
    const highlight = new URLSearchParams(window.location.search).get("highlight");
    if (highlight && assignments.some((a) => a.id === highlight)) {
      setExpandedId(highlight);
      requestAnimationFrame(() => {
        document.getElementById(`assignment-${highlight}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    }
  }, [assignments]);

  // Listen for code coming back from the IDE iframe
  useEffect(() => {
    function handler(e: MessageEvent) {
      if (e.data?.type === "code" && codeResolverRef.current) {
        codeResolverRef.current(e.data.code ?? "");
        codeResolverRef.current = null;
      }
    }
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  function openSubmit(id: string) {
    setSubmitId(id);
    setContent("");
    setFile(null);
  }

  function closeSubmit() {
    setSubmitId(null);
    setContent("");
    setFile(null);
  }

  async function handleIdeSubmit() {
    if (!submitId || !iframeRef.current?.contentWindow) return;
    setSubmitting(true);

    // Ask the IDE for the current code via postMessage
    const code = await new Promise<string>((resolve) => {
      const timeout = setTimeout(() => resolve(""), 4000);
      codeResolverRef.current = (c: string) => {
        clearTimeout(timeout);
        resolve(c);
      };
      iframeRef.current!.contentWindow!.postMessage({ type: "getCode" }, "*");
    });

    const res = await fetch(`/api/assignments/${submitId}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: code || undefined }),
    });

    if (res.ok) {
      setAssignments((prev) =>
        prev.map((a) =>
          a.id === submitId
            ? { ...a, submissions: [{ grade: null, status: "submitted", submittedAt: new Date().toISOString(), content: code }] }
            : a
        )
      );
      closeSubmit();
    }
    setSubmitting(false);
  }

  async function submitAssignment(e: React.FormEvent, assignmentId: string) {
    e.preventDefault();
    setSubmitting(true);

    const assignment = assignments.find((a) => a.id === assignmentId)!;

    let fileUrl: string | null = null;
    if (file) {
      setUploading(true);
      const fd = new FormData();
      fd.append("file", file);
      fd.append("allowedFileTypes", assignment.allowedFileTypes);
      const up = await fetch("/api/upload", { method: "POST", body: fd });
      const upData = await up.json();
      setUploading(false);
      if (!up.ok) { alert(upData.error); setSubmitting(false); return; }
      fileUrl = upData.url;
    }

    const res = await fetch(`/api/assignments/${assignmentId}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: content || undefined, fileUrl: fileUrl || undefined }),
    });

    if (res.ok) {
      setAssignments((prev) =>
        prev.map((a) =>
          a.id === assignmentId
            ? { ...a, submissions: [{ grade: null, status: "submitted", submittedAt: new Date().toISOString(), fileUrl: fileUrl ?? undefined, content }] }
            : a
        )
      );
      closeSubmit();
    }
    setSubmitting(false);
  }

  const typeLabels: Record<string, string> = {
    written: "تحریری", code: "رمز نویسی", quiz: "آزمائش", ide: "اڈا", other: "دیگر",
  };
  const pending = assignments.filter((a) => !a.submissions.length);
  const submitted = assignments.filter((a) => a.submissions.length > 0);

  function AssignmentCard({ a }: { a: Assignment }) {
    const sub = a.submissions[0];
    const isLate = a.dueDate && new Date() > new Date(a.dueDate) && !sub;
    const expanded = expandedId === a.id;
    const allowedTypes: string[] = JSON.parse(a.allowedFileTypes || "[]");

    return (
      <div id={`assignment-${a.id}`} className="card overflow-hidden scroll-mt-4">
        <div
          className="p-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setExpandedId(expanded ? null : a.id)}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            sub?.status === "graded" ? "bg-green-100" : sub ? "bg-yellow-100" : isLate ? "bg-red-100" : "bg-orange-100"
          }`}>
            {sub?.status === "graded" ? <CheckCircle className="w-5 h-5 text-green-700" /> :
             sub ? <Clock className="w-5 h-5 text-yellow-700" /> :
             isLate ? <AlertCircle className="w-5 h-5 text-red-700" /> :
             <ClipboardList className="w-5 h-5 text-orange-700" />}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-gray-900">{a.title}</h3>
              <span className="badge badge-blue text-xs">{typeLabels[a.type]}</span>
              {allowedTypes.length > 0 && <span className="badge badge-gray text-xs flex items-center gap-1"><Paperclip className="w-3 h-3" />دستاویز</span>}
              {sub?.status === "graded" && <span className="badge badge-green text-xs">جانچا گیا</span>}
              {sub?.status === "submitted" && <span className="badge badge-yellow text-xs">جمع شدہ</span>}
              {sub?.status === "late" && <span className="badge badge-red text-xs">دیر سے</span>}
              {!sub && !isLate && <span className="badge badge-gray text-xs">زیر التواء</span>}
              {isLate && !sub && <span className="badge badge-red text-xs">وقت گزر گیا</span>}
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
              <span>{a.class.name}</span>
              {a.dueDate && (
                <span className={`flex items-center gap-1 ${isLate && !sub ? "text-red-500" : ""}`}>
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(a.dueDate).toLocaleDateString("ur-PK")}
                </span>
              )}
              <span>{a.maxPoints} پوائنٹس</span>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            {sub?.grade !== null && sub?.grade !== undefined && (
              <span className={`text-lg font-bold ${sub.grade >= 80 ? "text-green-600" : sub.grade >= 60 ? "text-yellow-600" : "text-red-600"}`}>
                {sub.grade}/{a.maxPoints}
              </span>
            )}
            {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </div>
        </div>

        {expanded && (
          <div className="border-t border-gray-100 p-4 bg-gray-50">
            <p className="text-gray-700 urdu-text mb-4 text-sm">{a.description}</p>

            {allowedTypes.length > 0 && !sub && (
              <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
                <Paperclip className="w-3.5 h-3.5" />
                قابل قبول دستاویزات: {allowedTypes.map((t) => FILE_TYPE_LABEL[t] ?? t).join("، ")}
              </p>
            )}

            {sub ? (
              <div className="space-y-3">
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <p className="text-xs text-gray-500 mb-2">
                    جمع کر دیا گیا — {new Date(sub.submittedAt).toLocaleDateString("ur-PK")}
                  </p>
                  {sub.content && (a.type === "ide" || a.type === "code") && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><Code2 className="w-3 h-3" />جمع کیا گیا کوڈ</p>
                      <pre className="font-mono text-xs bg-gray-900 text-green-300 rounded-lg p-3 max-h-48 overflow-y-auto whitespace-pre-wrap text-center" dir="rtl">
                        {sub.content}
                      </pre>
                    </div>
                  )}
                  {sub.content && a.type === "written" && (
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{sub.content}</p>
                  )}
                  {sub.fileUrl && (
                    <a href={sub.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline mt-2">
                      <FileText className="w-4 h-4" />
                      دستاویز دیکھیں
                    </a>
                  )}
                </div>
                {sub.feedback && (
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                    <p className="text-xs text-blue-600 mb-1 font-medium">استاد کا تبصرہ</p>
                    <p className="text-sm text-blue-800">{sub.feedback}</p>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={() => openSubmit(a.id)} className="btn-primary text-sm">
                <Send className="w-4 h-4" />
                {a.type === "ide" ? "اڈا کھولیں" : "جواب پیش کریں"}
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  const activeAssignment = submitId ? assignments.find((a) => a.id === submitId) : null;
  const activeAllowedTypes: string[] = activeAssignment ? JSON.parse(activeAssignment.allowedFileTypes || "[]") : [];
  const acceptAttr = activeAllowedTypes.map((t) => FILE_TYPE_ACCEPT[t] ?? "").filter(Boolean).join(",");
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  return (
    <DashboardLayout title="مشقیں" subtitle={`${pending.length} زیر التواء · ${submitted.length} مکمل`}>
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-700 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {pending.length > 0 && (
            <div>
              <h2 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-500" />
                زیر التواء ({pending.length})
              </h2>
              <div className="space-y-3">
                {pending.map((a) => <AssignmentCard key={a.id} a={a} />)}
              </div>
            </div>
          )}
          {submitted.length > 0 && (
            <div>
              <h2 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                مکمل ({submitted.length})
              </h2>
              <div className="space-y-3">
                {submitted.map((a) => <AssignmentCard key={a.id} a={a} />)}
              </div>
            </div>
          )}
          {assignments.length === 0 && (
            <div className="text-center py-20">
              <ClipboardList className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">کوئی مشق نہیں ہے</p>
            </div>
          )}
        </div>
      )}

      {/* IDE Modal — full-screen iframe of the Vite IDE */}
      {submitId && activeAssignment?.type === "ide" && (
        <div className="fixed inset-0 z-50 flex flex-col bg-gray-950" dir="rtl">
          {/* Submit bar */}
          <div className="flex items-center gap-3 px-4 py-2 bg-gray-900 border-b border-gray-700 flex-shrink-0">
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold text-white truncate">{activeAssignment.title}</h2>
              <p className="text-xs text-gray-400 truncate">{activeAssignment.description}</p>
            </div>
            <button
              onClick={handleIdeSubmit}
              disabled={submitting}
              className="btn-primary text-sm py-1.5 px-4 flex items-center gap-1.5 flex-shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              {submitting ? "جمع ہو رہا ہے..." : "مکمل — جمع کریں"}
            </button>
            <button onClick={closeSubmit} className="flex-shrink-0">
              <X className="w-5 h-5 text-gray-400 hover:text-white" />
            </button>
          </div>
          {/* The actual IDE */}
          <iframe
            ref={iframeRef}
            src={`https://ide.nuqta.dev?assignmentId=${submitId}&studentName=${encodeURIComponent(studentName)}`}
            className="flex-1 w-full border-0"
            title="اردو اڈا"
            allow="clipboard-read; clipboard-write"
          />
        </div>
      )}

      {/* Text / File Submit Modal */}
      {submitId && activeAssignment && activeAssignment.type !== "ide" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" dir="rtl">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">جواب جمع کریں</h2>
              <button onClick={closeSubmit}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={(e) => submitAssignment(e, submitId)} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    {activeAssignment.type === "code" ? "رمز لکھیں" : "آپ کا جواب"}
                  </label>
                  {activeAssignment.type === "written" && content.trim() && (
                    <span className="text-xs text-gray-400">{wordCount} الفاظ</span>
                  )}
                </div>
                <textarea
                  className={`input-urdu ${activeAssignment.type === "code" ? "font-mono text-sm" : ""}`}
                  rows={activeAssignment.type === "code" ? 10 : 6}
                  placeholder={activeAssignment.type === "code" ? "// یہاں کوڈ لکھیں..." : "یہاں اپنا جواب لکھیں..."}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required={activeAllowedTypes.length === 0}
                  dir={activeAssignment.type === "code" ? "ltr" : "rtl"}
                />
              </div>

              {activeAllowedTypes.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    دستاویز منسلک کریں ({activeAllowedTypes.map((t) => FILE_TYPE_LABEL[t] ?? t).join("، ")})
                  </label>
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:border-blue-400 transition-colors"
                    onClick={() => fileRef.current?.click()}
                  >
                    {file ? (
                      <div className="flex items-center justify-center gap-2 text-sm text-gray-700">
                        <FileText className="w-4 h-4 text-blue-500" />
                        <span>{file.name}</span>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setFile(null); if (fileRef.current) fileRef.current.value = ""; }}
                          className="text-red-400 hover:text-red-600"
                        ><X className="w-3.5 h-3.5" /></button>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-400">
                        <Paperclip className="w-5 h-5 mx-auto mb-1" />
                        دستاویز منتخب کریں
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept={acceptAttr || undefined}
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting || uploading}
                  className="btn-primary flex-1 justify-center py-2.5"
                >
                  <Send className="w-4 h-4" />
                  {uploading ? "دستاویز ارسال ہو رہی ہے..." : submitting ? "جمع ہو رہا ہے..." : "جمع کریں"}
                </button>
                <button type="button" onClick={closeSubmit} className="btn-secondary px-5">منسوخ</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
