"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, Heart, LogOut } from "lucide-react";

import { MobileTabBar } from "@/components/mobile-tab-bar";
import { Button } from "@/components/ui/button";
import {
  ALL_NAV_ITEMS,
  currentPageLabel,
  isActivePath,
} from "@/lib/nav";
import { cn } from "@/lib/utils";

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
      {ALL_NAV_ITEMS.map(({ href, label, icon: Icon }) => {
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

function MobileAppBar() {
  const pathname = usePathname();
  const router = useRouter();
  const title = currentPageLabel(pathname);
  const showBack =
    pathname.startsWith("/guests/") ||
    /^\/vision-board\/[^/]+/.test(pathname);

  const backHref = pathname.startsWith("/guests/")
    ? "/guests"
    : pathname.includes("/links")
      ? pathname.replace(/\/links$/, "")
      : "/vision-board";

  return (
    <div className="sticky top-0 z-40 flex min-h-12 items-center gap-2 border-b border-border/80 bg-card/90 px-2 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur-md md:hidden">
      {showBack ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-11 shrink-0"
          aria-label="Go back"
          onClick={() => router.push(backHref)}
        >
          <ArrowLeft className="size-5" />
        </Button>
      ) : (
        <span className="size-2 shrink-0" aria-hidden />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-center font-heading text-lg font-semibold tracking-tight text-foreground">
          {title}
        </p>
      </div>
      {showBack ? <span className="size-11 shrink-0" aria-hidden /> : <span className="size-2 shrink-0" aria-hidden />}
    </div>
  );
}

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <>
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 border-r border-sidebar-border bg-sidebar/80 backdrop-blur-md md:block">
        <SidebarPanel pathname={pathname} />
      </aside>

      <MobileAppBar />
      <MobileTabBar />
    </>
  );
}
