import Link from "next/link";

// Shared across every Nuqta property — نقطہ always sits alone on the
// top-right (first DOM child; in this RTL layout that's the main-axis
// start), the label/redirect bar always on the top-left as a group (last
// DOM child). Whichever item is the current page renders bold/underlined.
// Same-tab by default; اڈا and رابطہ are the exceptions.
export type NavKey = "learn" | "ide" | "keyboard" | "pilot" | "about" | "contact";

const NAV_ITEMS: Array<{ key: NavKey; label: string; href: string; newTab?: boolean }> = [
  { key: "learn", label: "اسباق", href: "https://learn.nuqta.dev" },
  { key: "ide", label: "اڈا", href: "https://ide.nuqta.dev", newTab: true },
  { key: "keyboard", label: "کی-بورڈ", href: "https://keyboard.nuqta.dev" },
  { key: "pilot", label: "پائلٹ", href: "https://nuqta.dev/pilot" },
  { key: "about", label: "ہمارے بارے میں", href: "https://nuqta.dev/about" },
  { key: "contact", label: "رابطہ / تجاویز", href: "mailto:taimur.gaj@gmail.com", newTab: true },
];

export function SiteNav({ current }: { current?: NavKey }) {
  return (
    <nav className="border-b border-gray-800/50 bg-gray-950/80 backdrop-blur-md sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="https://nuqta.dev" className="text-lg font-bold text-white" style={{ fontFamily: "var(--font-urdu), serif" }}>
          نقطہ
        </Link>
        <div className="flex items-center gap-5 flex-wrap">
          {NAV_ITEMS.map((item) => {
            const isCurrent = item.key === current;
            return (
              <Link
                key={item.key}
                href={item.href}
                target={item.newTab ? "_blank" : undefined}
                rel={item.newTab ? "noopener noreferrer" : undefined}
                className={
                  isCurrent
                    ? "text-sm text-white font-bold border-b-2 border-blue-400 pb-0.5"
                    : "text-sm text-gray-300 hover:text-white transition-colors"
                }
                style={{ fontFamily: "var(--font-urdu), serif" }}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

export function SiteFooter({ current }: { current?: NavKey }) {
  return (
    <footer className="border-t border-gray-800 py-8 text-center text-sm text-gray-600" style={{ fontFamily: "var(--font-urdu), serif" }}>
      <p className="mb-2">© 2026 نقطہ</p>
      <div className="flex items-center justify-center gap-4 flex-wrap">
        <Link href="https://nuqta.dev" className="hover:text-gray-400 transition-colors">nuqta.dev</Link>
        {NAV_ITEMS.map((item) => {
          const isCurrent = item.key === current;
          return isCurrent ? (
            <span key={item.key} className="text-gray-400 font-bold">{item.label}</span>
          ) : (
            <Link
              key={item.key}
              href={item.href}
              target={item.newTab ? "_blank" : undefined}
              rel={item.newTab ? "noopener noreferrer" : undefined}
              className="hover:text-gray-400 transition-colors"
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </footer>
  );
}
