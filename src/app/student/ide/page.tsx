"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function IDEPage() {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-950">
      {/* Thin nav strip so the student can get back */}
      <div className="flex items-center gap-3 px-4 py-1.5 bg-gray-900 border-b border-gray-800 shrink-0" dir="rtl">
        <Link
          href="/student/dashboard"
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
        >
          <ArrowRight className="w-3.5 h-3.5" />
          ڈیش بورڈ
        </Link>
        <span className="text-gray-700 text-xs">|</span>
        <span className="text-blue-400 text-xs font-semibold">اردو اڈا</span>
      </div>
      <iframe
        src="https://ide.nuqta.dev"
        className="flex-1 w-full border-0"
        title="اردو اڈا"
        allow="clipboard-read; clipboard-write"
      />
    </div>
  );
}
