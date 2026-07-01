"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { User, Lock, Check, AlertCircle, ShieldCheck, Copy, Eye, EyeOff } from "lucide-react";

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const u = session?.user as { name?: string; email?: string; isOrgAdmin?: boolean } | undefined;

  const [name, setName] = useState(u?.name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [codePassword, setCodePassword] = useState("");
  const [codeStatus, setCodeStatus] = useState<"idle" | "checking" | "ok" | "error">("idle");
  const [codeMsg, setCodeMsg] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [codeCopied, setCodeCopied] = useState(false);

  const [nameStatus, setNameStatus] = useState<"idle" | "saving" | "ok" | "error">("idle");
  const [passStatus, setPassStatus] = useState<"idle" | "saving" | "ok" | "error">("idle");
  const [nameMsg, setNameMsg] = useState("");
  const [passMsg, setPassMsg] = useState("");

  async function revealCode(e: React.FormEvent) {
    e.preventDefault();
    setCodeStatus("checking");
    setCodeMsg("");
    const res = await fetch("/api/me", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: codePassword }),
    });
    const data = await res.json();
    if (res.ok) {
      setJoinCode(data.joinCode);
      setCodeStatus("ok");
    } else {
      setCodeStatus("error");
      setCodeMsg(data.error || "خرابی ہوئی");
      setTimeout(() => setCodeStatus("idle"), 2500);
    }
  }

  function copyCode() {
    navigator.clipboard.writeText(joinCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  }

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setNameStatus("saving");
    const res = await fetch("/api/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (res.ok) {
      setNameStatus("ok");
      setNameMsg("نام کامیابی سے تبدیل ہو گیا");
      await update({ name });
      setTimeout(() => setNameStatus("idle"), 3000);
    } else {
      setNameStatus("error");
      setNameMsg(data.error || "خرابی ہوئی");
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPassStatus("error");
      setPassMsg("نئے خفیہ رمز مطابقت نہیں رکھتے");
      return;
    }
    setPassStatus("saving");
    const res = await fetch("/api/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    if (res.ok) {
      setPassStatus("ok");
      setPassMsg("خفیہ رمز کامیابی سے تبدیل ہو گیا");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPassStatus("idle"), 3000);
    } else {
      setPassStatus("error");
      setPassMsg(data.error || "خرابی ہوئی");
    }
  }

  return (
    <DashboardLayout title="ترتیبات" subtitle="اپنا کھاتہ منظم کریں">
      <div className="max-w-lg space-y-6">

        {/* Join code — org admins only */}
        {u?.isOrgAdmin && (
          <div className="card p-6 border border-yellow-200 bg-yellow-50">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 bg-yellow-200 rounded-xl flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-yellow-700" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">شمولیتی رمز</h2>
                <p className="text-xs text-gray-500">تصدیق کے بعد رمز ظاہر ہوگا</p>
              </div>
            </div>

            {codeStatus === "ok" ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 bg-white border border-yellow-300 rounded-xl px-4 py-3">
                  <span className="flex-1 text-2xl font-bold tracking-widest text-yellow-800">{joinCode}</span>
                  <button onClick={copyCode} className="text-yellow-600 hover:text-yellow-800 transition-colors">
                    {codeCopied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
                <button
                  onClick={() => { setCodeStatus("idle"); setJoinCode(""); setCodePassword(""); }}
                  className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
                >
                  <EyeOff className="w-3.5 h-3.5" /> چھپائیں
                </button>
              </div>
            ) : (
              <form onSubmit={revealCode} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">اپنا خفیہ رمز درج کریں</label>
                  <div className="relative">
                    <input
                      type="password"
                      className="input-urdu pr-10"
                      value={codePassword}
                      onChange={(e) => setCodePassword(e.target.value)}
                      placeholder="خفیہ رمز"
                      required
                      autoComplete="current-password"
                    />
                    <Eye className="w-4 h-4 text-gray-300 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
                {codeStatus === "error" && (
                  <div className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg bg-red-50 text-red-700">
                    <AlertCircle className="w-4 h-4" />{codeMsg}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={codeStatus === "checking"}
                  className="btn-primary text-sm bg-yellow-600 hover:bg-yellow-700"
                >
                  {codeStatus === "checking" ? "تصدیق ہو رہی ہے..." : "رمز دیکھیں"}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Profile section */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
              <User className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">تعارف</h2>
              <p className="text-xs text-gray-500">{u?.email}</p>
            </div>
          </div>

          <form onSubmit={saveName} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">پورا نام</label>
              <input
                type="text"
                className="input-urdu"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {nameStatus !== "idle" && (
              <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
                nameStatus === "ok" ? "bg-green-50 text-green-700" :
                nameStatus === "error" ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"
              }`}>
                {nameStatus === "ok" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {nameMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={nameStatus === "saving"}
              className="btn-primary text-sm"
            >
              {nameStatus === "saving" ? "محفوظ ہو رہا ہے..." : "نام محفوظ کریں"}
            </button>
          </form>
        </div>

        {/* Password section */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center">
              <Lock className="w-5 h-5 text-purple-700" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">خفیہ رمز تبدیل کریں</h2>
              <p className="text-xs text-gray-500">محفوظ رہنے کے لیے مضبوط خفیہ رمز استعمال کریں</p>
            </div>
          </div>

          <form onSubmit={savePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">موجودہ خفیہ رمز</label>
              <input
                type="password"
                className="input-urdu"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">نیا خفیہ رمز</label>
              <input
                type="password"
                className="input-urdu"
                placeholder="کم از کم ۸ حروف"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">نئے خفیہ رمز کی تصدیق</label>
              <input
                type="password"
                className="input-urdu"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {passStatus !== "idle" && (
              <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
                passStatus === "ok" ? "bg-green-50 text-green-700" :
                passStatus === "error" ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"
              }`}>
                {passStatus === "ok" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {passMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={passStatus === "saving"}
              className="btn-primary text-sm"
            >
              {passStatus === "saving" ? "محفوظ ہو رہا ہے..." : "خفیہ رمز تبدیل کریں"}
            </button>
          </form>
        </div>

      </div>
    </DashboardLayout>
  );
}
