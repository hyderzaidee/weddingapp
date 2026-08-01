"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { VISION_BOARDS } from "@/lib/vision-board";

export default function VisionBoardIndexPage() {
  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h1 className="font-heading text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          Vision Board
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Shared whiteboards for Dholki, Mayon, Barat, and Valima — pin pics,
          links, and sticky notes together. Everyone can add and rearrange.
        </p>
      </div>

      <ul className="grid gap-2.5 sm:grid-cols-2">
        {VISION_BOARDS.map((board) => (
          <li key={board.id}>
            <Link
              href={`/vision-board/${board.id}`}
              className="wedding-panel flex h-full items-start justify-between gap-3 rounded-2xl px-4 py-4 transition-colors hover:bg-muted/40 sm:px-5"
            >
              <div className="min-w-0">
                <p className="font-heading text-lg font-semibold text-foreground">
                  {board.label}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {board.description}
                </p>
              </div>
              <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
