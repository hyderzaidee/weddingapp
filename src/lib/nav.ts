import {
  CalendarDays,
  CheckSquare,
  LayoutDashboard,
  PiggyBank,
  Sparkles,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { getVisionBoard, isVisionBoardId } from "@/lib/vision-board";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const ALL_NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/money", label: "Money", icon: Wallet },
  { href: "/budget", label: "Budget", icon: PiggyBank },
  { href: "/events", label: "Events", icon: CalendarDays },
  { href: "/guests", label: "Guests", icon: Users },
  { href: "/vision-board", label: "Vision Board", icon: Sparkles },
];

export const PRIMARY_TAB_HREFS = ["/", "/tasks", "/money", "/guests"] as const;

export const PRIMARY_TABS: NavItem[] = ALL_NAV_ITEMS.filter((item) =>
  (PRIMARY_TAB_HREFS as readonly string[]).includes(item.href)
);

export const MORE_NAV_ITEMS: NavItem[] = ALL_NAV_ITEMS.filter(
  (item) => !(PRIMARY_TAB_HREFS as readonly string[]).includes(item.href)
);

export function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function currentPageLabel(pathname: string) {
  if (pathname === "/") return "Wedding Prep";

  const boardMatch = /^\/vision-board\/([^/]+)/.exec(pathname);
  if (boardMatch && isVisionBoardId(boardMatch[1])) {
    const board = getVisionBoard(boardMatch[1]);
    return pathname.endsWith("/links") ? `${board.label} links` : board.label;
  }

  if (pathname.startsWith("/guests/")) return "Guests";

  const match = ALL_NAV_ITEMS.find((item) => isActivePath(pathname, item.href));
  if (match) return match.label;

  return "Wedding Prep";
}

export function isMoreRoute(pathname: string) {
  return MORE_NAV_ITEMS.some((item) => isActivePath(pathname, item.href));
}

/** Mobile bottom tab bar height (excluding safe-area). */
export const MOBILE_TAB_BAR_HEIGHT_PX = 64;
