"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type NavIcon =
  | "dashboard"
  | "star"
  | "mail"
  | "users"
  | "billing"
  | "settings";

type NavItem = {
  href: string;
  label: string;
  icon: NavIcon;
  badge?: string;
  requireRole?: "owner" | "admin" | "member";
};

const ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/avis", label: "Avis", icon: "star" },
  { href: "/campagnes", label: "Campagnes", icon: "mail" },
  { href: "/contacts", label: "Contacts", icon: "users" },
  { href: "/membres", label: "Membres", icon: "users", requireRole: "owner" },
  { href: "/facturation", label: "Facturation", icon: "billing" },
  { href: "/parametres", label: "Parametres", icon: "settings" },
  {label: "Sources", href: "/sources", icon: "settings", badge: "BETA" },
  {label: "Support", href: "/support", icon: "users"},
];

const Icon = ({ type }: { type: NavIcon }) => {
  const base = "h-4 w-4 shrink-0 text-current";
  switch (type) {
    case "dashboard":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={base}>
          <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      );
    case "star":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={base}>
          <path d="m12 3.8 2.6 5.2 5.7.8-4.1 4 1 5.7-5.2-2.7-5.2 2.7 1-5.7-4.1-4 5.7-.8L12 3.8Z" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      );
    case "mail":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={base}>
          <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
          <path d="m4.5 7.2 7.5 6.2 7.5-6.2" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      );
    case "users":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={base}>
          <path d="M7.2 11a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Zm9.6 0a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z" stroke="currentColor" strokeWidth="1.8" />
          <path d="M2.8 19c0-2.8 2.2-5 5-5s5 2.2 5 5M11.2 19c0-2.8 2.2-5 5-5s5 2.2 5 5" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      );
    case "billing":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={base}>
          <rect x="3" y="6" width="18" height="12" rx="2.2" stroke="currentColor" strokeWidth="1.8" />
          <path d="M3 10h18" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" className={base}>
          <path d="M12 7.8a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4Zm0 12.8a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4Zm8.8-8.8a2.2 2.2 0 1 0-4.4 0 2.2 2.2 0 0 0 4.4 0Zm-12.8 0a2.2 2.2 0 1 0-4.4 0 2.2 2.2 0 0 0 4.4 0Z" stroke="currentColor" strokeWidth="1.8" />
          <path d="m13.9 9.9 2.3-1.3m-8.4 4.9 2.3-1.3m3.8 1.9 2.3 1.3m-8.4-4.9 2.3 1.3" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      );
  }
};

type SidebarProps = {
  orgName: string;
  plan: string;
  role: string;
};

export const Sidebar = ({ orgName, plan, role }: SidebarProps) => {
  const pathname = usePathname();
  const visibleItems = ITEMS.filter(
    (item) => !item.requireRole || plan === "pro" || role === "owner",
  );

  return (
    <aside className="rf-app-sidebar">
      <div className="rf-sidebar-brand">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--rf-primary)] text-[15px] font-semibold text-white">
          RF
        </span>
        <div>
          <p className="rf-page-title text-[1.55rem] font-semibold leading-none">ReviewFlow</p>
          <p className="mt-1 text-xs text-[var(--rf-text-muted)]">{orgName}</p>
        </div>
      </div>

      <nav className="rf-sidebar-nav">
        {ITEMS.map((item) => {
          // On filtre les items en fonction du rôle requis
          if (item.requireRole && item.requireRole !== role) {
            return null;
          }
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn("rf-sidebar-item", active && "rf-sidebar-item-active")}
            >
              <span className="inline-flex items-center gap-3">
                <Icon type={item.icon} />
                <span>{item.label}</span>
              </span>
              {item.badge ? (
                <span className="rounded-md bg-[var(--rf-primary)] px-2 py-0.5 text-xs text-white">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
