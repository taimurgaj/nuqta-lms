"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard, BookOpen, Users, ClipboardList,
  Library, BarChart3, Brain, LogOut, Settings,
  GraduationCap, ChevronRight, Building2, BookMarked,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const teacherNav: NavItem[] = [
  { href: "/teacher/dashboard", label: "خلاصہ", icon: <LayoutDashboard className="w-4 h-4" /> },
  { href: "/teacher/classes", label: "اسباق", icon: <Users className="w-4 h-4" /> },
  { href: "/teacher/assignments", label: "مشقیں", icon: <ClipboardList className="w-4 h-4" /> },
  { href: "/teacher/curriculum", label: "کتب خانہ", icon: <Library className="w-4 h-4" /> },
  { href: "/teacher/analytics", label: "تجزیہ", icon: <BarChart3 className="w-4 h-4" /> },
];

const studentNav: NavItem[] = [
  { href: "/student/dashboard", label: "خلاصہ", icon: <LayoutDashboard className="w-4 h-4" /> },
  { href: "/student/courses", label: "اسباق · نتائج", icon: <BookMarked className="w-4 h-4" /> },
  { href: "/student/assignments", label: "مشقیں", icon: <ClipboardList className="w-4 h-4" /> },
  { href: "/student/ai-tutor", label: "ذہین معلم", icon: <Brain className="w-4 h-4" /> },
];

export default function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const u = session?.user as { role?: string; isOrgAdmin?: boolean; orgName?: string } | undefined;
  const role = u?.role;
  const isAdmin = u?.isOrgAdmin;
  const nav = role === "teacher" || role === "admin" || isAdmin ? teacherNav : studentNav;

  return (
    <aside className="w-60 min-h-screen bg-white border-l border-gray-100 flex flex-col shadow-sm">
      {/* Logo */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-700 rounded-lg flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm text-gray-900 truncate">
              {u?.orgName || "اردو تعلیمی"}
            </p>
            <p className="text-xs text-gray-500">
              {isAdmin ? "منتظم" : role === "teacher" || role === "admin" ? "استاد" : "طالب علم"}
            </p>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="px-3 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <span className="text-blue-700 font-bold text-sm">
              {session?.user?.name?.charAt(0) || "؟"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{session?.user?.name}</p>
            <p className="text-xs text-gray-500 truncate">{session?.user?.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {nav.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${isActive ? "active" : ""}`}
            >
              {item.icon}
              <span className="text-sm font-medium">{item.label}</span>
              {isActive && <ChevronRight className="w-3 h-3 mr-auto" />}
            </Link>
          );
        })}

        {/* Org admin link */}
        {u?.isOrgAdmin && (
          <>
            <div className="pt-2 pb-1">
              <p className="text-xs text-gray-400 px-3 font-medium">منتظم</p>
            </div>
            <Link
              href="/teacher/org"
              className={`nav-item ${pathname === "/teacher/org" ? "active" : ""}`}
            >
              <Building2 className="w-4 h-4" />
              <span className="text-sm font-medium">ادارے کا انتظام</span>
              {pathname === "/teacher/org" && <ChevronRight className="w-3 h-3 mr-auto" />}
            </Link>
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-gray-100 space-y-1">
        <Link href="/settings" className="nav-item">
          <Settings className="w-4 h-4" />
          <span className="text-sm font-medium">ترتیبات</span>
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="nav-item w-full text-red-500 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-medium">باہر نکلیں</span>
        </button>
      </div>
    </aside>
  );
}
