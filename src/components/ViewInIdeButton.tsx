"use client";

import { useRef, useState } from "react";
import { Code2, X } from "lucide-react";

// Reuses the same postMessage bridge the embedded IDE already exposes to
// lesson pages ({type:"setCode", code}) to load a student's submitted code
// into a real, interactive Nuqta اڈا session for the teacher — read-only in
// spirit (nothing writes back to the submission) but fully runnable, not
// just a static <pre> dump.
export function ViewInIdeButton({ code, studentName }: { code: string; studentName: string }) {
  const [open, setOpen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  function handleLoad() {
    iframeRef.current?.contentWindow?.postMessage({ type: "setCode", code }, "*");
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-blue-600 text-sm hover:underline flex items-center gap-1"
      >
        <Code2 className="w-3.5 h-3.5" />
        اڈا میں کھولیں
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-gray-950" dir="rtl">
          <div className="flex items-center gap-3 px-4 py-2 bg-gray-900 border-b border-gray-700 flex-shrink-0">
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold text-white truncate">{studentName} کا جمع کردہ کوڈ</h2>
              <p className="text-xs text-gray-400 truncate">صرف دیکھنے کے لیے — یہاں کی تبدیلیاں طالب علم کے جمع کردہ کام میں محفوظ نہیں ہوں گی</p>
            </div>
            <button onClick={() => setOpen(false)} className="flex-shrink-0">
              <X className="w-5 h-5 text-gray-400 hover:text-white" />
            </button>
          </div>
          <iframe
            ref={iframeRef}
            src="https://ide.nuqta.dev"
            className="flex-1 w-full border-0"
            title="اردو اڈا"
            allow="clipboard-read; clipboard-write"
            onLoad={handleLoad}
          />
        </div>
      )}
    </>
  );
}
