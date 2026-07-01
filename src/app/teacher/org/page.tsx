"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Building2, Users, Copy, Check, Plus, Trash2, X,
  ShieldCheck, GraduationCap, BookOpen, Layers, ChevronDown, ChevronUp,
  UserCheck, ChevronLeft, KeyRound,
} from "lucide-react";

interface SubAccount {
  id: string; name: string; type: string; createdAt: string;
  children?: SubAccount[];
}
interface OrgSubject { id: string; name: string }
interface Member { id: string; name: string; email: string; role: string; isOrgAdmin: boolean; createdAt: string }
interface OrgClass {
  id: string; name: string; subject: string | null; gradeLevel: string; code: string;
  teacher: { id: string; name: string };
  enrollments: Array<{ student: { id: string; name: string; email: string } }>;
  jamaatId: string | null;
}
interface Jamaat {
  id: string; name: string;
  classes: Array<{ id: string; name: string; gradeLevel: string; subject: string | null; teacher: { id: string; name: string } }>;
}
interface OrgInfo { id: string; name: string; slug: string; city: string | null; joinCode: string; createdAt: string }

const TYPE_LABELS: Record<string, string> = { division: "تقسیم", department: "شعبہ" };
const TYPE_COLORS: Record<string, string> = {
  division: "bg-blue-100 text-blue-700", department: "bg-purple-100 text-purple-700",
};

const GRADES = ["تمام جماعتیں", "پہلی", "دوسری", "تیسری", "چوتھی", "پانچویں", "چھٹی", "ساتویں", "آٹھویں", "نہم", "دہم", "یازدہم", "دوازدہم", "دیگر"];

export default function OrgAdminPage() {
  const { data: session } = useSession();
  const u = session?.user as { isOrgAdmin?: boolean; orgSlug?: string; orgName?: string } | undefined;

  const [org, setOrg] = useState<OrgInfo | null>(null);
  const [subAccounts, setSubAccounts] = useState<SubAccount[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [subjects, setSubjects] = useState<OrgSubject[]>([]);
  const [classes, setClasses] = useState<OrgClass[]>([]);
  const [jamaats, setJamaats] = useState<Jamaat[]>([]);
  const [tab, setTab] = useState<"overview" | "units" | "subjects" | "classes" | "members" | "jamaats">("overview");

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Units tree
  const [addingDiv, setAddingDiv] = useState(false);
  const [newDivName, setNewDivName] = useState("");
  const [addingDeptForDiv, setAddingDeptForDiv] = useState<string | null>(null);
  const [newDeptName, setNewDeptName] = useState("");
  const [savingUnit, setSavingUnit] = useState(false);

  // Subjects
  const [newSubject, setNewSubject] = useState("");
  const [savingSubject, setSavingSubject] = useState(false);

  // اسباق
  const [showAddClass, setShowAddClass] = useState(false);
  const [classForm, setClassForm] = useState({ name: "", description: "", gradeLevel: "", teacherId: "", divisionId: "", subAccountId: "" });
  const [savingClass, setSavingClass] = useState(false);
  const [expandedClass, setExpandedClass] = useState<string | null>(null);
  const [enrollPickerId, setEnrollPickerId] = useState<string | null>(null);
  const [enrollUserId, setEnrollUserId] = useState("");

  // جماعتیں
  const [showAddJamaat, setShowAddJamaat] = useState(false);
  const [newJamaatName, setNewJamaatName] = useState("");
  const [savingJamaat, setSavingJamaat] = useState(false);
  const [assigningToJamaat, setAssigningToJamaat] = useState<string | null>(null);
  const [assignClassId, setAssignClassId] = useState("");

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
    fetch(`/api/orgs/${orgSlug}/subaccounts`).then((r) => r.json()).then(setSubAccounts).catch(() => {});
    setLoadingMembers(true);
    fetch(`/api/orgs/${orgSlug}/members`).then((r) => r.json()).then(setMembers).catch(() => {}).finally(() => setLoadingMembers(false));
    fetch(`/api/orgs/${orgSlug}/subjects`).then((r) => r.json()).then((d) => Array.isArray(d) && setSubjects(d)).catch(() => {});
    fetch(`/api/orgs/${orgSlug}/classes`).then((r) => r.json()).then((d) => Array.isArray(d) && setClasses(d)).catch(() => {});
    fetch(`/api/orgs/${orgSlug}/jamaats`).then((r) => r.json()).then((d) => Array.isArray(d) && setJamaats(d)).catch(() => {});
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

  // ── Units ──
  async function addDivision(e: React.FormEvent) {
    e.preventDefault(); setSavingUnit(true);
    const res = await fetch(`/api/orgs/${orgSlug}/subaccounts`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newDivName, type: "division" }),
    });
    if (res.ok) { const nu = await res.json(); setSubAccounts((p) => [...p, { ...nu, children: [] }]); setNewDivName(""); setAddingDiv(false); }
    setSavingUnit(false);
  }

  async function addDepartment(e: React.FormEvent, divId: string) {
    e.preventDefault(); setSavingUnit(true);
    const res = await fetch(`/api/orgs/${orgSlug}/subaccounts`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newDeptName, type: "department", parentId: divId }),
    });
    if (res.ok) {
      const nu = await res.json();
      setSubAccounts((p) => p.map((div) => div.id === divId ? { ...div, children: [...(div.children || []), nu] } : div));
      setNewDeptName(""); setAddingDeptForDiv(null);
    }
    setSavingUnit(false);
  }

  async function deleteUnit(id: string, parentId?: string) {
    if (!confirm("کیا آپ اس اکائی کو حذف کرنا چاہتے ہیں؟")) return;
    const res = await fetch(`/api/orgs/${orgSlug}/subaccounts`, {
      method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }),
    });
    if (res.ok) {
      if (parentId) {
        setSubAccounts((p) => p.map((div) => div.id === parentId ? { ...div, children: (div.children || []).filter((c) => c.id !== id) } : div));
      } else {
        setSubAccounts((p) => p.filter((s) => s.id !== id));
      }
    }
  }

  // ── Subjects ──
  async function addSubject(e: React.FormEvent) {
    e.preventDefault(); if (!newSubject.trim()) return; setSavingSubject(true);
    const res = await fetch(`/api/orgs/${orgSlug}/subjects`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newSubject }),
    });
    if (res.ok) { const ns = await res.json(); setSubjects((p) => [...p, ns]); setNewSubject(""); }
    setSavingSubject(false);
  }

  async function deleteSubject(id: string) {
    const res = await fetch(`/api/orgs/${orgSlug}/subjects`, {
      method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }),
    });
    if (res.ok) setSubjects((p) => p.filter((s) => s.id !== id));
  }

  // ── اسباق ──
  async function addClass(e: React.FormEvent) {
    e.preventDefault(); setSavingClass(true);
    const { divisionId: _, ...payload } = classForm;
    const res = await fetch(`/api/orgs/${orgSlug}/classes`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    });
    if (res.ok) {
      const nc = await res.json();
      setClasses((p) => [nc, ...p]);
      setClassForm({ name: "", description: "", gradeLevel: "", teacherId: "", divisionId: "", subAccountId: "" });
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

  // ── جماعتیں ──
  async function addJamaat(e: React.FormEvent) {
    e.preventDefault(); setSavingJamaat(true);
    const res = await fetch(`/api/orgs/${orgSlug}/jamaats`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newJamaatName }),
    });
    if (res.ok) { const nj = await res.json(); setJamaats((p) => [...p, nj]); setNewJamaatName(""); setShowAddJamaat(false); }
    setSavingJamaat(false);
  }

  async function deleteJamaat(id: string) {
    if (!confirm("کیا آپ اس جماعت کو حذف کرنا چاہتے ہیں؟")) return;
    const res = await fetch(`/api/orgs/${orgSlug}/jamaats`, {
      method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setJamaats((p) => p.filter((j) => j.id !== id));
      setClasses((p) => p.map((c) => c.jamaatId === id ? { ...c, jamaatId: null } : c));
    }
  }

  async function assignClass(jamaatId: string) {
    if (!assignClassId) return;
    const res = await fetch(`/api/orgs/${orgSlug}/jamaats`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ classId: assignClassId, jamaatId }),
    });
    if (res.ok) {
      const updated = await res.json();
      setClasses((p) => p.map((c) => c.id === assignClassId ? { ...c, jamaatId } : c));
      setJamaats((p) => p.map((j) => j.id === jamaatId ? { ...j, classes: [...j.classes, { id: updated.id, name: updated.name, gradeLevel: updated.gradeLevel, subject: updated.subject, teacher: updated.teacher }] } : j));
      setAssigningToJamaat(null); setAssignClassId("");
    }
  }

  async function removeClassFromJamaat(classId: string, jamaatId: string) {
    const res = await fetch(`/api/orgs/${orgSlug}/jamaats`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ classId, jamaatId: null }),
    });
    if (res.ok) {
      setClasses((p) => p.map((c) => c.id === classId ? { ...c, jamaatId: null } : c));
      setJamaats((p) => p.map((j) => j.id === jamaatId ? { ...j, classes: j.classes.filter((c) => c.id !== classId) } : j));
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

  // Departments filtered by selected division (for cascading dropdown)
  const filteredDepts = classForm.divisionId
    ? (subAccounts.find((d) => d.id === classForm.divisionId)?.children || [])
    : [];

  // Classes not yet in any jamaat (available to assign)
  const unassignedClasses = (jamaatId: string) => classes.filter((c) => !c.jamaatId || c.jamaatId === jamaatId);

  const TABS = [
    { key: "overview", label: "جائزہ" },
    { key: "classes", label: "اسباق" },
    { key: "jamaats", label: "جماعتیں" },
    { key: "subjects", label: "مضامین" },
    { key: "units", label: "اکائیاں" },
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
              <p className="text-xs text-gray-500">اسباق</p>
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

      {/* ── اسباق ── */}
      {tab === "classes" && (
        <div className="space-y-4 max-w-3xl">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">{classes.length} اسباق</p>
            <button onClick={() => setShowAddClass(true)} className="btn-primary text-sm">
              <Plus className="w-4 h-4" /> نیا سبق
            </button>
          </div>

          {showAddClass && (
            <div className="card p-5 border-2 border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 text-sm">نیا سبق بنائیں</h3>
                <button onClick={() => setShowAddClass(false)}><X className="w-4 h-4 text-gray-400" /></button>
              </div>
              <form onSubmit={addClass} className="space-y-3">
                <input className="input-urdu" placeholder="سبق کا نام *" value={classForm.name}
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

                <select className="input-urdu" value={classForm.divisionId}
                  onChange={(e) => setClassForm({ ...classForm, divisionId: e.target.value, subAccountId: "" })} required>
                  <option value="">تقسیم منتخب کریں *</option>
                  {subAccounts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>

                {classForm.divisionId && (
                  <select className="input-urdu" value={classForm.subAccountId}
                    onChange={(e) => setClassForm({ ...classForm, subAccountId: e.target.value })} required>
                    <option value="">شعبہ منتخب کریں *</option>
                    {filteredDepts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                )}

                <textarea className="input-urdu" rows={2} placeholder="تفصیل (اختیاری)"
                  value={classForm.description} onChange={(e) => setClassForm({ ...classForm, description: e.target.value })} />

                <div className="flex gap-3">
                  <button type="submit" disabled={savingClass} className="btn-primary text-sm">
                    {savingClass ? "بن رہا ہے..." : "سبق بنائیں"}
                  </button>
                  <button type="button" onClick={() => setShowAddClass(false)} className="btn-secondary text-sm">منسوخ</button>
                </div>
              </form>
            </div>
          )}

          {subAccounts.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm text-yellow-700">
              سبق بنانے سے پہلے "اکائیاں" ٹیب میں تقسیم اور شعبہ بنائیں
            </div>
          )}

          {classes.length === 0 ? (
            <div className="text-center py-14">
              <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500 text-sm">ابھی تک کوئی سبق نہیں بنایا</p>
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

      {/* ── جماعتیں ── */}
      {tab === "jamaats" && (
        <div className="space-y-4 max-w-2xl">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">ہر جماعت اسباق کا مجموعہ ہے</p>
            <button onClick={() => setShowAddJamaat(true)} className="btn-primary text-sm">
              <Plus className="w-4 h-4" /> نئی جماعت
            </button>
          </div>

          {showAddJamaat && (
            <div className="card p-4 border-2 border-blue-200">
              <h3 className="font-bold text-gray-900 text-sm mb-3">نئی جماعت بنائیں</h3>
              <form onSubmit={addJamaat} className="flex gap-3">
                <input className="input-urdu flex-1" placeholder="جیسے: نہم الف، دہم ب" value={newJamaatName}
                  onChange={(e) => setNewJamaatName(e.target.value)} required autoFocus />
                <button type="submit" disabled={savingJamaat} className="btn-primary text-sm px-4">{savingJamaat ? "..." : "بنائیں"}</button>
                <button type="button" onClick={() => { setShowAddJamaat(false); setNewJamaatName(""); }} className="btn-secondary text-sm px-3">منسوخ</button>
              </form>
            </div>
          )}

          {jamaats.length === 0 ? (
            <div className="text-center py-14">
              <GraduationCap className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500 text-sm">ابھی تک کوئی جماعت نہیں بنائی</p>
            </div>
          ) : (
            <div className="space-y-3">
              {jamaats.map((j) => (
                <div key={j.id} className="card overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3 bg-green-50">
                    <GraduationCap className="w-4 h-4 text-green-700 flex-shrink-0" />
                    <span className="flex-1 font-semibold text-gray-900">{j.name}</span>
                    <span className="text-xs text-gray-500">{j.classes.length} اسباق</span>
                    <button onClick={() => { setAssigningToJamaat(j.id); setAssignClassId(""); }}
                      className="text-xs text-green-700 hover:text-green-800 font-medium flex items-center gap-1">
                      <Plus className="w-3 h-3" /> سبق
                    </button>
                    <button onClick={() => deleteJamaat(j.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {assigningToJamaat === j.id && (
                    <div className="px-4 py-3 bg-green-50 border-t border-green-100">
                      <div className="flex gap-2">
                        <select className="input-urdu flex-1 text-sm" value={assignClassId} onChange={(e) => setAssignClassId(e.target.value)}>
                          <option value="">سبق منتخب کریں</option>
                          {classes.filter((c) => !c.jamaatId).map((c) => (
                            <option key={c.id} value={c.id}>{c.name} — جماعت {c.gradeLevel}</option>
                          ))}
                        </select>
                        <button onClick={() => assignClass(j.id)} className="btn-primary text-xs px-3">شامل</button>
                        <button onClick={() => setAssigningToJamaat(null)} className="btn-secondary text-xs px-2">منسوخ</button>
                      </div>
                    </div>
                  )}

                  {j.classes.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-3">ابھی کوئی سبق نہیں — اوپر "+ سبق" دبائیں</p>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {j.classes.map((c) => (
                        <div key={c.id} className="flex items-center gap-3 px-4 py-2.5 pr-8 hover:bg-gray-50">
                          <ChevronLeft className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                          <BookOpen className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                          <span className="flex-1 text-sm text-gray-800">{c.name}</span>
                          <span className="text-xs text-gray-400">جماعت {c.gradeLevel}</span>
                          <span className="text-xs text-gray-400">{c.teacher.name}</span>
                          <button onClick={() => removeClassFromJamaat(c.id, j.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── مضامین ── */}
      {tab === "subjects" && (
        <div className="space-y-4 max-w-lg">
          <p className="text-sm text-gray-500">ادارے کے مضامین — سبق بناتے وقت حوالے کے لیے</p>
          <form onSubmit={addSubject} className="flex gap-3">
            <input className="input-urdu flex-1" placeholder="نیا مضمون — جیسے: اردو، ریاضی، سائنس"
              value={newSubject} onChange={(e) => setNewSubject(e.target.value)} required />
            <button type="submit" disabled={savingSubject} className="btn-primary text-sm px-4">
              {savingSubject ? "..." : "شامل کریں"}
            </button>
          </form>
          {subjects.length === 0 ? (
            <div className="text-center py-14">
              <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500 text-sm">ابھی تک کوئی مضمون نہیں شامل کیا</p>
            </div>
          ) : (
            <div className="space-y-2">
              {subjects.map((s) => (
                <div key={s.id} className="card px-4 py-3 flex items-center gap-3">
                  <BookOpen className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span className="flex-1 font-medium text-gray-800">{s.name}</span>
                  <button onClick={() => deleteSubject(s.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── اکائیاں (Division → Department tree) ── */}
      {tab === "units" && (
        <div className="space-y-4 max-w-2xl">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">پہلے تقسیم بنائیں، پھر ہر تقسیم کے تحت شعبے</p>
            <button onClick={() => { setAddingDiv(true); setAddingDeptForDiv(null); }} className="btn-primary text-sm">
              <Plus className="w-4 h-4" /> نئی تقسیم
            </button>
          </div>

          {addingDiv && (
            <div className="card p-4 border-2 border-blue-200">
              <h3 className="font-bold text-gray-900 text-sm mb-3">نئی تقسیم شامل کریں</h3>
              <form onSubmit={addDivision} className="flex gap-3">
                <input className="input-urdu flex-1" placeholder="تقسیم کا نام" value={newDivName}
                  onChange={(e) => setNewDivName(e.target.value)} required autoFocus />
                <button type="submit" disabled={savingUnit} className="btn-primary text-sm px-4">{savingUnit ? "..." : "شامل کریں"}</button>
                <button type="button" onClick={() => { setAddingDiv(false); setNewDivName(""); }} className="btn-secondary text-sm px-3">منسوخ</button>
              </form>
            </div>
          )}

          {subAccounts.length === 0 ? (
            <div className="text-center py-14">
              <Layers className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500 text-sm">ابھی تک کوئی تقسیم نہیں بنائی</p>
              <p className="text-gray-400 text-xs mt-1">اوپر "نئی تقسیم" بٹن سے شروع کریں</p>
            </div>
          ) : (
            <div className="space-y-3">
              {subAccounts.map((div) => (
                <div key={div.id} className="card overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3 bg-blue-50">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS.division}`}>{TYPE_LABELS.division}</span>
                    <span className="flex-1 font-semibold text-gray-900">{div.name}</span>
                    <button onClick={() => { setAddingDeptForDiv(div.id); setNewDeptName(""); setAddingDiv(false); }}
                      className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium">
                      <Plus className="w-3 h-3" /> شعبہ
                    </button>
                    <button onClick={() => deleteUnit(div.id)} className="text-gray-300 hover:text-red-500 transition-colors mr-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {addingDeptForDiv === div.id && (
                    <div className="px-4 py-3 bg-purple-50 border-t border-purple-100">
                      <form onSubmit={(e) => addDepartment(e, div.id)} className="flex gap-2">
                        <ChevronLeft className="w-4 h-4 text-purple-400 flex-shrink-0 mt-2.5" />
                        <input className="input-urdu flex-1 text-sm py-2" placeholder="شعبے کا نام"
                          value={newDeptName} onChange={(e) => setNewDeptName(e.target.value)} required autoFocus />
                        <button type="submit" disabled={savingUnit} className="btn-primary text-xs px-3">{savingUnit ? "..." : "شامل"}</button>
                        <button type="button" onClick={() => setAddingDeptForDiv(null)} className="btn-secondary text-xs px-2">منسوخ</button>
                      </form>
                    </div>
                  )}
                  {(div.children || []).length > 0 && (
                    <div className="divide-y divide-gray-50">
                      {(div.children || []).map((dept) => (
                        <div key={dept.id} className="flex items-center gap-3 px-4 py-2.5 pr-8 hover:bg-gray-50">
                          <ChevronLeft className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS.department}`}>{TYPE_LABELS.department}</span>
                          <span className="flex-1 text-sm text-gray-800">{dept.name}</span>
                          <button onClick={() => deleteUnit(dept.id, div.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {(div.children || []).length === 0 && addingDeptForDiv !== div.id && (
                    <p className="text-xs text-gray-400 text-center py-2">ابھی کوئی شعبہ نہیں — اوپر "+ شعبہ" دبائیں</p>
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
