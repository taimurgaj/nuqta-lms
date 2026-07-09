"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Building2, Users, Copy, Check, Plus, X,
  ShieldCheck, GraduationCap, BookOpen, ChevronDown, ChevronUp,
  UserCheck, KeyRound,
} from "lucide-react";

interface Member { id: string; name: string; email: string; role: string; isOrgAdmin: boolean; createdAt: string }
interface OrgClass {
  id: string; name: string; subject: string | null; gradeLevel: string; code: string;
  teacher: { id: string; name: string };
  enrollments: Array<{ student: { id: string; name: string; email: string } }>;
}
interface OrgInfo { id: string; name: string; slug: string; city: string | null; joinCode: string; createdAt: string }

const GRADES = ["تمام جماعتیں", "پہلی", "دوسری", "تیسری", "چوتھی", "پانچویں", "چھٹی", "ساتویں", "آٹھویں", "نہم", "دہم", "یازدہم", "دوازدہم", "دیگر"];

export default function OrgAdminPage() {
  const { data: session } = useSession();
  const u = session?.user as { isOrgAdmin?: boolean; orgSlug?: string; orgName?: string } | undefined;

  const [org, setOrg] = useState<OrgInfo | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [classes, setClasses] = useState<OrgClass[]>([]);
  const [tab, setTab] = useState<"overview" | "classes" | "members">("overview");

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Classes
  const [showAddClass, setShowAddClass] = useState(false);
  const [classForm, setClassForm] = useState({ name: "", description: "", gradeLevel: "", teacherId: "" });
  const [savingClass, setSavingClass] = useState(false);
  const [expandedClass, setExpandedClass] = useState<string | null>(null);
  const [enrollPickerId, setEnrollPickerId] = useState<string | null>(null);
  const [enrollUserId, setEnrollUserId] = useState("");

  // Members
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [promotingId, setPromotingId] = useState<string | null>(null);
  const [resetId, setResetId] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetStatus, setResetStatus] = useState<"idle" | "saving" | "ok" | "error">("idle");

  const orgSlug = u?.orgSlug;

  useEffect(() => {
    if (!orgSlug) return;
    fetch(`/api/orgs/${orgSlug}`).then((r) => r.json()).then(setOrg).catch(() => {});
    setLoadingMembers(true);
    fetch(`/api/orgs/${orgSlug}/members`).then((r) => r.json()).then(setMembers).catch(() => {}).finally(() => setLoadingMembers(false));
    fetch(`/api/orgs/${orgSlug}/classes`).then((r) => r.json()).then((d) => Array.isArray(d) && setClasses(d)).catch(() => {});
  }, [orgSlug]);

  if (!u?.isOrgAdmin) {
    return (
      <DashboardLayout title="ادارہ" subtitle="صرف منتظم کے لیے">
        <div className="flex flex-col items-center justify-center h-60 text-gray-400">
          <ShieldCheck className="w-14 h-14 mb-3" />
          <p>آپ کو اس صفحے تک رسائی نہیں</p>
        </div>
      </DashboardLayout>
    );
  }

  function copy(text: string, which: "code" | "url") {
    navigator.clipboard.writeText(text);
    if (which === "code") { setCopiedCode(true); setTimeout(() => setCopiedCode(false), 2000); }
    else { setCopiedUrl(true); setTimeout(() => setCopiedUrl(false), 2000); }
  }

  // ── Classes ──
  async function addClass(e: React.FormEvent) {
    e.preventDefault(); setSavingClass(true);
    const res = await fetch(`/api/orgs/${orgSlug}/classes`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(classForm),
    });
    if (res.ok) {
      const nc = await res.json();
      setClasses((p) => [nc, ...p]);
      setClassForm({ name: "", description: "", gradeLevel: "", teacherId: "" });
      setShowAddClass(false);
    }
    setSavingClass(false);
  }

  async function enrollStudent(classId: string) {
    if (!enrollUserId) return;
    const res = await fetch(`/api/classes/${classId}/enroll`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: enrollUserId }),
    });
    if (res.ok) {
      const enrollment = await res.json();
      setClasses((prev) => prev.map((c) => c.id === classId ? { ...c, enrollments: [...c.enrollments, { student: enrollment.student }] } : c));
      setEnrollPickerId(null); setEnrollUserId("");
    }
  }

  async function removeStudent(classId: string, userId: string) {
    const res = await fetch(`/api/classes/${classId}/enroll`, {
      method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId }),
    });
    if (res.ok) {
      setClasses((prev) => prev.map((c) => c.id === classId ? { ...c, enrollments: c.enrollments.filter((e) => e.student.id !== userId) } : c));
    }
  }

  // ── Members ──
  async function resetMemberPassword(memberId: string) {
    if (!resetPassword || resetPassword.length < 4) return;
    setResetStatus("saving");
    const res = await fetch(`/api/orgs/${orgSlug}/members/${memberId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: resetPassword }),
    });
    if (res.ok) {
      setResetStatus("ok");
      setTimeout(() => { setResetId(null); setResetPassword(""); setResetStatus("idle"); }, 1500);
    } else {
      setResetStatus("error");
      setTimeout(() => setResetStatus("idle"), 2000);
    }
  }

  async function promoteRole(memberId: string, currentRole: string) {
    const newRole = currentRole === "teacher" ? "student" : "teacher";
    setPromotingId(memberId);
    const res = await fetch(`/api/orgs/${orgSlug}/members/${memberId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role: newRole }),
    });
    if (res.ok) {
      const updated = await res.json();
      setMembers((prev) => prev.map((m) => m.id === memberId ? { ...m, role: updated.role } : m));
    }
    setPromotingId(null);
  }

  const teacherCount = members.filter((m) => m.role === "teacher" || m.isOrgAdmin).length;
  const studentCount = members.filter((m) => m.role === "student").length;
  const hubUrl = typeof window !== "undefined" ? `${window.location.origin}/org/${orgSlug}` : `/org/${orgSlug}`;
  const teachers = members.filter((m) => m.role === "teacher" || m.isOrgAdmin);
  const students = members.filter((m) => m.role === "student");

  const TABS = [
    { key: "overview", label: "جائزہ" },
    { key: "classes", label: "کلاسز" },
    { key: "members", label: "اراکین" },
  ] as const;

  return (
    <DashboardLayout title="ادارے کا انتظام" subtitle={org?.name || u?.orgName || ""}>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 flex-wrap">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === "overview" && org && (
        <div className="space-y-5 max-w-2xl">
          <div className="grid grid-cols-3 gap-4">
            <div className="card p-4 text-center">
              <GraduationCap className="w-6 h-6 mx-auto text-blue-600 mb-1" />
              <p className="text-2xl font-bold text-gray-900">{teacherCount}</p>
              <p className="text-xs text-gray-500">اساتذہ</p>
            </div>
            <div className="card p-4 text-center">
              <Users className="w-6 h-6 mx-auto text-green-600 mb-1" />
              <p className="text-2xl font-bold text-gray-900">{studentCount}</p>
              <p className="text-xs text-gray-500">طلبہ</p>
            </div>
            <div className="card p-4 text-center">
              <BookOpen className="w-6 h-6 mx-auto text-purple-600 mb-1" />
              <p className="text-2xl font-bold text-gray-900">{classes.length}</p>
              <p className="text-xs text-gray-500">کلاسز</p>
            </div>
          </div>

          <div className="card p-6 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-700 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">{org.name}</h2>
                {org.city && <p className="text-sm text-gray-500">{org.city}</p>}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1.5">مرکزی صفحہ</p>
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-200">
                <span className="flex-1 text-sm text-blue-700 font-mono break-all text-left" dir="ltr">{hubUrl}</span>
                <button onClick={() => copy(hubUrl, "url")}>
                  {copiedUrl ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-400 hover:text-blue-600" />}
                </button>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1.5">شمولیتی رمز</p>
              <div className="flex items-center gap-2 bg-blue-50 rounded-xl px-3 py-2.5 border border-blue-200">
                <span className="flex-1 text-xl font-bold text-blue-800 tracking-widest">{org.joinCode}</span>
                <button onClick={() => copy(org.joinCode, "code")}>
                  {copiedCode ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-blue-400 hover:text-blue-700" />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">طلبہ اندراج کے وقت یہ رمز استعمال کریں</p>
            </div>
          </div>
        </div>
      )}

      {/* ── کلاسز ── */}
      {tab === "classes" && (
        <div className="space-y-4 max-w-3xl">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">{classes.length} کلاسز</p>
            <button onClick={() => setShowAddClass(true)} className="btn-primary text-sm">
              <Plus className="w-4 h-4" /> نئی کلاس
            </button>
          </div>

          {showAddClass && (
            <div className="card p-5 border-2 border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 text-sm">نئی کلاس بنائیں</h3>
                <button onClick={() => setShowAddClass(false)}><X className="w-4 h-4 text-gray-400" /></button>
              </div>
              <form onSubmit={addClass} className="space-y-3">
                <input className="input-urdu" placeholder="کلاس کا نام *" value={classForm.name}
                  onChange={(e) => setClassForm({ ...classForm, name: e.target.value })} required />

                <div className="grid grid-cols-2 gap-3">
                  <select className="input-urdu" value={classForm.gradeLevel}
                    onChange={(e) => setClassForm({ ...classForm, gradeLevel: e.target.value })} required>
                    <option value="">جماعت منتخب کریں *</option>
                    {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                  <select className="input-urdu" value={classForm.teacherId}
                    onChange={(e) => setClassForm({ ...classForm, teacherId: e.target.value })} required>
                    <option value="">استاد منتخب کریں *</option>
                    {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>

                <textarea className="input-urdu" rows={2} placeholder="تفصیل (اختیاری)"
                  value={classForm.description} onChange={(e) => setClassForm({ ...classForm, description: e.target.value })} />

                <div className="flex gap-3">
                  <button type="submit" disabled={savingClass} className="btn-primary text-sm">
                    {savingClass ? "بن رہی ہے..." : "کلاس بنائیں"}
                  </button>
                  <button type="button" onClick={() => setShowAddClass(false)} className="btn-secondary text-sm">منسوخ</button>
                </div>
              </form>
            </div>
          )}

          {classes.length === 0 ? (
            <div className="text-center py-14">
              <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500 text-sm">ابھی تک کوئی کلاس نہیں بنائی</p>
            </div>
          ) : (
            <div className="space-y-3">
              {classes.map((cls) => (
                <div key={cls.id} className="card overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50"
                    onClick={() => setExpandedClass(expandedClass === cls.id ? null : cls.id)}>
                    <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-4 h-4 text-blue-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{cls.name}</p>
                      <p className="text-xs text-gray-500">
                        {cls.subject && `${cls.subject} · `}جماعت {cls.gradeLevel} · استاد: {cls.teacher?.name}
                      </p>
                    </div>
                    <span className="badge badge-green text-xs">{cls.enrollments.length} طلبہ</span>
                    <span className="font-mono text-xs text-gray-400">{cls.code}</span>
                    {expandedClass === cls.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>

                  {expandedClass === cls.id && (
                    <div className="border-t border-gray-100 px-4 py-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium text-gray-700">فہرست طلبہ ({cls.enrollments.length})</p>
                        <button onClick={() => { setEnrollPickerId(cls.id); setEnrollUserId(""); }} className="btn-primary text-xs py-1.5 px-3">
                          <Plus className="w-3 h-3" /> طالب علم شامل کریں
                        </button>
                      </div>
                      {enrollPickerId === cls.id && (
                        <div className="flex gap-2 mb-3">
                          <select className="input-urdu flex-1 text-sm" value={enrollUserId} onChange={(e) => setEnrollUserId(e.target.value)}>
                            <option value="">طالب علم منتخب کریں</option>
                            {students.filter((s) => !cls.enrollments.find((e) => e.student.id === s.id))
                              .map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                          <button onClick={() => enrollStudent(cls.id)} className="btn-primary text-xs px-3">شامل</button>
                          <button onClick={() => setEnrollPickerId(null)} className="btn-secondary text-xs px-3">منسوخ</button>
                        </div>
                      )}
                      {cls.enrollments.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-3">ابھی کوئی طالب علم نہیں</p>
                      ) : (
                        <div className="space-y-1">
                          {cls.enrollments.map((e) => (
                            <div key={e.student.id} className="flex items-center gap-3 bg-white rounded-lg px-3 py-2">
                              <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-green-700 font-bold text-xs">{e.student.name.charAt(0)}</span>
                              </div>
                              <span className="flex-1 text-sm text-gray-800">{e.student.name}</span>
                              <span className="text-xs text-gray-400 ltr-text">{e.student.email}</span>
                              <button onClick={() => removeStudent(cls.id, e.student.id)} className="text-gray-300 hover:text-red-500">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── اراکین ── */}
      {tab === "members" && (
        <div className="space-y-4 max-w-3xl">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">ادارے کے تمام اساتذہ اور طلبہ</p>
            <div className="flex items-center gap-2 text-xs text-gray-500 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
              <span>رمز:</span>
              <span className="font-bold text-blue-700">{org?.joinCode}</span>
            </div>
          </div>
          {loadingMembers ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-7 h-7 border-4 border-blue-200 border-t-blue-700 rounded-full animate-spin" />
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-14">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500 text-sm">ابھی تک کوئی رکن نہیں</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="divide-y divide-gray-100">
                {members.map((m) => (
                  <div key={m.id}>
                    <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-700 font-bold text-sm">{m.name.charAt(0)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 text-sm">{m.name}</p>
                          {m.isOrgAdmin && <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">منتظم</span>}
                        </div>
                        <p className="text-xs text-gray-400 truncate" dir="ltr">{m.email}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${m.isOrgAdmin ? "bg-yellow-100 text-yellow-700" : m.role === "teacher" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                        {m.isOrgAdmin ? "منتظم" : m.role === "teacher" ? "استاد" : "طالب علم"}
                      </span>
                      <button
                        onClick={() => { setResetId(resetId === m.id ? null : m.id); setResetPassword(""); setResetStatus("idle"); }}
                        title="خفیہ رمز بدلیں"
                        className={`transition-colors ${resetId === m.id ? "text-purple-600" : "text-gray-300 hover:text-purple-500"}`}>
                        <KeyRound className="w-4 h-4" />
                      </button>
                      {!m.isOrgAdmin && (
                        <button onClick={() => promoteRole(m.id, m.role)} disabled={promotingId === m.id}
                          title={m.role === "teacher" ? "طالب علم بنائیں" : "استاد بنائیں"}
                          className="text-gray-300 hover:text-blue-600 transition-colors">
                          <UserCheck className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {resetId === m.id && (
                      <div className="px-4 py-3 bg-purple-50 border-t border-purple-100 flex items-center gap-2">
                        <KeyRound className="w-4 h-4 text-purple-400 flex-shrink-0" />
                        <input
                          type="password"
                          className="input-urdu flex-1 text-sm py-1.5"
                          placeholder="نیا خفیہ رمز (کم از کم ۴ حروف)"
                          value={resetPassword}
                          onChange={(e) => setResetPassword(e.target.value)}
                          autoFocus
                          onKeyDown={(e) => e.key === "Enter" && resetMemberPassword(m.id)}
                        />
                        <button
                          onClick={() => resetMemberPassword(m.id)}
                          disabled={resetStatus === "saving" || resetPassword.length < 4}
                          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                            resetStatus === "ok" ? "bg-green-600 text-white" :
                            resetStatus === "error" ? "bg-red-600 text-white" :
                            "bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-40"
                          }`}>
                          {resetStatus === "saving" ? "..." : resetStatus === "ok" ? "✓" : resetStatus === "error" ? "✗" : "بدلیں"}
                        </button>
                        <button onClick={() => { setResetId(null); setResetPassword(""); setResetStatus("idle"); }}
                          className="text-gray-400 hover:text-gray-600">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
