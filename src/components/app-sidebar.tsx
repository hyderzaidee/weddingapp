"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CheckSquare,
  Gift,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  PiggyBank,
  Shirt,
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
  { href: "/budget", label: "Budget", icon: PiggyBank },
  { href: "/money", label: "Money", icon: Wallet },
  { href: "/clothes", label: "Clothes & Events", icon: Shirt },
  { href: "/gifts", label: "Gifts", icon: Gift },
] as const;

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Brand({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link
      href="/"
      onClick={onNavigate}
      className="group flex items-center gap-2.5"
    >
      <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
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
    <nav className="flex flex-1 flex-col gap-1">
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive = isActivePath(pathname, href);

        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
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
  return (
    <div className="mt-auto space-y-3 px-1">
      <form action="/api/logout" method="POST">
        <Button
          type="submit"
          variant="ghost"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
          onClick={onNavigate}
        >
          <LogOut className="size-4" />
          Log out
        </Button>
      </form>
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
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r border-sidebar-border bg-sidebar backdrop-blur-md md:block">
        <SidebarPanel pathname={pathname} />
      </aside>

      <div className="sticky top-0 z-40 flex items-center gap-3 border-b border-border/80 bg-card/90 px-4 py-3 backdrop-blur-md md:hidden">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-9 shrink-0"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </Button>
        <Link href="/" className="min-w-0">
          <p className="truncate font-heading text-base font-semibold tracking-tight text-foreground">
            Wedding Prep
          </p>
        </Link>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="w-[min(100%,18rem)] border-border bg-card p-0"
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
