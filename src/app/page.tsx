"use client";

import Link from "next/link";
import { Users, Brain, Code2, Library, BarChart3, ArrowLeft, GraduationCap, Building2 } from "lucide-react";
import { DemoLoginButtons } from "@/components/DemoLoginButtons";
import { SiteNav, SiteFooter } from "@/components/SiteNav";

const features = [
  {
    icon: <GraduationCap className="w-6 h-6" />,
    title: "استاد کا خلاصہ",
    desc: "جماعت کی فہرست، مشقیں، جائزے اور مکمل انتظامی کنٹرول",
    color: "bg-blue-100 text-blue-700",
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "طالب علم کا حساب",
    desc: "جماعتیں، مشقیں اور اپنی پیشرفت دیکھیں",
    color: "bg-green-100 text-green-700",
  },
  {
    icon: <Brain className="w-6 h-6" />,
    title: "ذہین معلم",
    desc: "اردو میں مصنوعی ذہانت سے بات کریں اور فوری مدد حاصل کریں",
    color: "bg-purple-100 text-purple-700",
  },
  {
    icon: <Code2 className="w-6 h-6" />,
    title: "اردو اڈا",
    desc: "اردو میں رمز نویسی سیکھیں اور رمز لکھیں",
    color: "bg-orange-100 text-orange-700",
  },
  {
    icon: <Library className="w-6 h-6" />,
    title: "مقرر نصاب",
    desc: "بنیادی سے لے کر پروجیکٹس تک، ۲۰ تیار سبق",
    color: "bg-teal-100 text-teal-700",
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: "تجزیاتی جائزہ",
    desc: "طلبہ کی کارکردگی اور پیشرفت کی مکمل تفصیل",
    color: "bg-red-100 text-red-700",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50" dir="rtl">
      <SiteNav />

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
          <span>اساتذہ اور طلبہ کے لیے</span>
        </div>
        <h2 className="text-5xl font-bold text-gray-900 mb-6 leading-tight" style={{ lineHeight: "1.4" }}>
          اردو میں سیکھیں،
          <span className="text-blue-700"> اردو میں سکھائیں</span>
        </h2>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto" style={{ lineHeight: "2" }}>
          اردو پر مبنی کلاس روم پلیٹ فارم — اساتذہ اور طلبہ کے لیے بنایا گیا، ذہین معلم، اردو اڈا، اور آف لائن نصاب کے ساتھ۔
        </p>
        <p className="text-sm text-gray-500 mb-6">
          پہلے سے کھاتہ ہے؟{" "}
          <Link href="/login" className="text-blue-700 font-medium hover:underline">داخل ہوں</Link>
        </p>
        <div className="flex justify-center gap-4 flex-wrap mb-6">
          <Link href="/register?role=teacher" className="btn-primary px-8 py-3 text-base">
            استاد کے طور پر شروع کریں
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <Link href="/register?role=student" className="btn-secondary px-8 py-3 text-base">
            طالب علم کے طور پر شروع کریں
          </Link>
        </div>

        <div className="bg-gray-900 rounded-2xl p-6 max-w-xl mx-auto">
          <p className="text-white text-sm mb-4">
            کھاتہ بنائے بغیر دیکھنا چاہتے ہیں؟ ایک تیار شدہ نمونہ جماعت آزمائیں —
            ۵ طلبہ، مشقیں، اور نتائج کے ساتھ۔
          </p>
          <DemoLoginButtons />
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <h3 className="text-2xl font-bold text-center text-gray-800 mb-10">کیا کیا ملے گا؟</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="card p-6 hover:shadow-md transition-shadow">
              <div className={`stat-icon ${f.color} mb-4`}>{f.icon}</div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h4>
              <p className="text-gray-600 text-sm" style={{ lineHeight: "1.8" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Org CTA */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <div className="bg-gradient-to-br from-blue-900 to-blue-700 rounded-3xl p-10 text-center text-white">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-white/20 rounded-2xl mb-4">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <h3 className="text-2xl font-bold mb-3">اپنے ادارے کے لیے</h3>
          <p className="text-blue-200 mb-6 max-w-lg mx-auto" style={{ lineHeight: "1.8" }}>
            اسکول، کالج یا تعلیمی ادارہ رجسٹر کریں اور اپنا مخصوص مرکزی نظام حاصل کریں — اپنے اساتذہ، طلبہ اور نصاب کے ساتھ
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link href="/orgs/register" className="inline-flex items-center gap-2 bg-white text-blue-700 px-7 py-3 rounded-xl font-bold hover:bg-blue-50 transition-colors">
              <Building2 className="w-4 h-4" />
              ادارہ رجسٹر کریں
            </Link>
            <Link href="/register" className="inline-flex items-center gap-2 bg-white/20 text-white px-7 py-3 rounded-xl font-medium hover:bg-white/30 transition-colors border border-white/30">
              انفرادی اندراج
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="bg-blue-700 text-white py-16 text-center">
        <h3 className="text-3xl font-bold mb-4">آج ہی شروع کریں</h3>
        <p className="text-blue-200 mb-8 text-lg">مفت اندراج — استاد یا طالب علم، سب کے لیے</p>
        <Link href="/register" className="inline-flex items-center gap-2 bg-white text-blue-700 px-8 py-3 rounded-xl font-bold hover:bg-blue-50 transition-colors">
          ابھی اندراج کریں
          <ArrowLeft className="w-4 h-4" />
        </Link>
      </section>

      <SiteFooter />
    </div>
  );
}
