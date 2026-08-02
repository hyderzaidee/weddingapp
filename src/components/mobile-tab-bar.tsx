"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Ellipsis, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  isActivePath,
  isMoreRoute,
  MORE_NAV_ITEMS,
  PRIMARY_TABS,
} from "@/lib/nav";
import { cn } from "@/lib/utils";

export function MobileTabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const moreActive = isMoreRoute(pathname);

  async function handleLogout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setMoreOpen(false);
    try {
      await fetch("/api/logout", { method: "POST", redirect: "manual" });
    } catch {
      // Still leave the session UI even if the request fails.
    } finally {
      window.location.href = "/login";
    }
  }

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
        style={{ height: `calc(4rem + env(safe-area-inset-bottom, 0px))` }}
        aria-label="Primary"
      >
        <div className="mx-auto grid h-16 max-w-lg grid-cols-5 px-1">
          {PRIMARY_TABS.map(({ href, label, icon: Icon }) => {
            const active = isActivePath(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                prefetch
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-medium transition-colors",
                  active
                    ? "text-primary"
                    : "text-muted-foreground active:text-foreground"
                )}
              >
                <span
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full transition-colors",
                    active && "bg-primary/12"
                  )}
                >
                  <Icon
                    className={cn("size-5", active && "stroke-[2.25px]")}
                  />
                </span>
                {label}
              </Link>
            );
          })}

          <button
            type="button"
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-medium transition-colors",
              moreActive
                ? "text-primary"
                : "text-muted-foreground active:text-foreground"
            )}
            onClick={() => setMoreOpen(true)}
            aria-label="More"
          >
            <span
              className={cn(
                "flex size-8 items-center justify-center rounded-full transition-colors",
                moreActive && "bg-primary/12"
              )}
            >
              <Ellipsis className={cn("size-5", moreActive && "stroke-[2.25px]")} />
            </span>
            More
          </button>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-3xl border-border bg-card px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3"
        >
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border" />
          <SheetHeader className="mb-2 text-left">
            <SheetTitle className="font-heading text-lg">More</SheetTitle>
          </SheetHeader>
          <div className="space-y-1">
            {MORE_NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = isActivePath(pathname, href);
              return (
                <button
                  key={href}
                  type="button"
                  className={cn(
                    "flex w-full min-h-12 items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-muted/70 active:bg-muted"
                  )}
                  onClick={() => {
                    setMoreOpen(false);
                    router.push(href);
                  }}
                >
                  <Icon className="size-5 shrink-0" />
                  {label}
                </button>
              );
            })}
            <div className="my-2 h-px bg-border" />
            <Button
              type="button"
              variant="ghost"
              className="h-12 w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
              disabled={isLoggingOut}
              onClick={() => void handleLogout()}
            >
              <LogOut className="size-5" />
              Log out
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
