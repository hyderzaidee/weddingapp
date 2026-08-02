"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  CheckSquare,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  PiggyBank,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/money", label: "Money", icon: Wallet },
  { href: "/budget", label: "Budget", icon: PiggyBank },
  { href: "/events", label: "Events", icon: CalendarDays },
  { href: "/guests", label: "Guests", icon: Users },
  { href: "/vision-board", label: "Vision Board", icon: Sparkles },
] as const;

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function currentPageLabel(pathname: string) {
  const match = navItems.find((item) => isActivePath(pathname, item.href));
  return match?.label ?? "Wedding Prep";
}

function Brand({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link
      href="/"
      onClick={onNavigate}
      className="group flex items-center gap-2.5"
    >
      <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105 md:size-9">
        <Heart className="size-4 fill-current" />
      </span>
      <div className="min-w-0">
        <p className="truncate font-heading text-base font-semibold tracking-tight text-foreground">
          Wedding Prep
        </p>
        <p className="text-xs text-muted-foreground">Shaadi planning</p>
      </div>
    </Link>
  );
}

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-1 flex-col gap-1.5">
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive = isActivePath(pathname, href);

        return (
          <Link
            key={href}
            href={href}
            prefetch
            onClick={onNavigate}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon
              className={cn(
                "size-4 shrink-0",
                isActive ? "text-primary-foreground" : "text-maroon/75"
              )}
            />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarFooter({ onNavigate }: { onNavigate?: () => void }) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    onNavigate?.();
    try {
      await fetch("/api/logout", { method: "POST", redirect: "manual" });
    } catch {
      // Still leave the session UI even if the request fails.
    } finally {
      window.location.href = "/login";
    }
  }

  return (
    <div className="mt-auto space-y-3 px-1 pb-[env(safe-area-inset-bottom)]">
      <Button
        type="button"
        variant="ghost"
        className="h-11 w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
        disabled={isLoggingOut}
        onClick={() => void handleLogout()}
      >
        <LogOut className="size-4" />
        Log out
      </Button>
      <p className="px-2 text-xs leading-relaxed text-muted-foreground/80">
        Shadi ki tayari — sab kuch ek jagah.
      </p>
    </div>
  );
}

function SidebarPanel({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col px-4 py-6">
      <div className="mb-6 px-2">
        <Brand onNavigate={onNavigate} />
      </div>
      <div className="desi-divider mb-6" />
      <NavLinks pathname={pathname} onNavigate={onNavigate} />
      <SidebarFooter onNavigate={onNavigate} />
    </div>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 border-r border-sidebar-border bg-sidebar/80 backdrop-blur-md md:block">
        <SidebarPanel pathname={pathname} />
      </aside>

      <div className="sticky top-0 z-40 flex items-center gap-3 border-b border-border/80 bg-card/80 px-3 py-2.5 pt-[max(0.625rem,env(safe-area-inset-top))] backdrop-blur-md md:hidden">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-11 shrink-0"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-heading text-base font-semibold tracking-tight text-foreground">
            {currentPageLabel(pathname)}
          </p>
          <p className="truncate text-[11px] text-muted-foreground">
            Wedding Prep
          </p>
        </div>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="w-[min(100%,20rem)] border-border bg-card p-0"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <SidebarPanel
            pathname={pathname}
            onNavigate={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
