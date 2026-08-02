"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";
import type { VisionBoardId } from "@/types/database";

type VisionBoardTabsProps = {
  boardId: VisionBoardId;
  active: "board" | "links";
};

export function VisionBoardTabs({ boardId, active }: VisionBoardTabsProps) {
  const tabs = [
    { id: "board" as const, label: "Board", href: `/vision-board/${boardId}` },
    {
      id: "links" as const,
      label: "Links",
      href: `/vision-board/${boardId}/links`,
    },
  ];

  return (
    <div className="mt-3 flex gap-1 rounded-xl bg-muted/60 p-1">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          className={cn(
            "flex-1 rounded-lg px-3 py-2 text-center text-sm font-medium transition-colors",
            active === tab.id
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
