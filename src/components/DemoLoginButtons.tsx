"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GraduationCap, Users } from "lucide-react";

export function DemoLoginButtons() {
  return (
    <Suspense fallback={<div className="flex justify-center gap-4 flex-wrap h-12" />}>
      <DemoLoginButtonsInner />
    </Suspense>
  );
}

function DemoLoginButtonsInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState<"teacher" | "student" | null>(null);

  async function tryDemo(role: "teacher" | "student") {
    setLoading(role);

    // Each click gets its own fresh, isolated org/class/students instead of
    // everyone sharing one real read-write account — see src/lib/demoSandbox.ts.
    // The spawn response sets the session cookie directly (see
    // /api/demo/spawn), so there's no separate signIn() round trip needed —
    // that used to mean a whole second request re-verifying a password we'd
    // generated ourselves a moment earlier.
    const spawnRes = await fetch("/api/demo/spawn", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (!spawnRes.ok) {
      setLoading(null);
      alert("ڈیمو تیار نہیں ہو سکا، دوبارہ کوشش کریں");
      return;
    }

    router.push(role === "teacher" ? "/teacher/dashboard" : "/student/dashboard");
  }

  // Deep-link support: /?demo=teacher or /?demo=student auto-triggers the demo login,
  // so other Nuqta properties (e.g. the /pilot page) can link straight into a live demo.
  useEffect(() => {
    const demo = searchParams.get("demo");
    if (demo === "teacher" || demo === "student") tryDemo(demo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex justify-center gap-4 flex-wrap">
      <button
        onClick={() => tryDemo("teacher")}
        disabled={loading !== null}
        className="inline-flex items-center gap-2 bg-white/20 text-white px-6 py-3 rounded-xl font-medium hover:bg-white/30 transition-colors border border-white/30 disabled:opacity-50"
      >
        <GraduationCap className="w-4 h-4" />
        {loading === "teacher" ? "لوڈ ہو رہا ہے..." : "استاد کا ڈیمو دیکھیں"}
      </button>
      <button
        onClick={() => tryDemo("student")}
        disabled={loading !== null}
        className="inline-flex items-center gap-2 bg-white/20 text-white px-6 py-3 rounded-xl font-medium hover:bg-white/30 transition-colors border border-white/30 disabled:opacity-50"
      >
        <Users className="w-4 h-4" />
        {loading === "student" ? "لوڈ ہو رہا ہے..." : "طالب علم کا ڈیمو دیکھیں"}
      </button>
    </div>
  );
}
