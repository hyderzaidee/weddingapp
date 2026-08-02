"use client";

import { MessageCircle, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import type { VisionBoardItem } from "@/types/database";

type VisionBoardPhotoTileProps = {
  item: VisionBoardItem;
  leftPercent: number;
  topPercent: number;
  widthPercent: number;
  onPreview: (url: string) => void;
  onComment: (item: VisionBoardItem) => void;
  onDeleteRequest: (item: VisionBoardItem) => void;
};

export function VisionBoardPhotoTile({
  item,
  leftPercent,
  topPercent,
  widthPercent,
  onPreview,
  onComment,
  onDeleteRequest,
}: VisionBoardPhotoTileProps) {
  if (!item.image_url) return null;

  const hasComment = Boolean(item.content?.trim());

  return (
    <article
      className="absolute z-[2] overflow-hidden rounded-xl bg-white p-1.5 shadow-[2px_6px_18px_rgba(40,25,10,0.18)] ring-1 ring-black/10"
      style={{
        left: `${leftPercent}%`,
        top: `${topPercent}%`,
        width: `${widthPercent}%`,
      }}
    >
      <div className="relative overflow-hidden rounded-lg">
        <button
          type="button"
          className="block w-full overflow-hidden rounded-lg"
          onClick={() => onPreview(item.image_url!)}
          aria-label="View photo"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.image_url}
            alt=""
            className="pointer-events-none aspect-[4/3] w-full object-cover"
            draggable={false}
          />
        </button>
        <div className="absolute right-1 top-1 flex items-center gap-1 sm:right-1.5 sm:top-1.5 sm:gap-1.5">
          <button
            type="button"
            className={cn(
              "rounded-full bg-white/90 p-2 text-muted-foreground shadow-sm transition hover:text-foreground",
              hasComment && "text-maroon"
            )}
            aria-label={hasComment ? "Edit comment" : "Add comment"}
            onClick={(event) => {
              event.stopPropagation();
              onComment(item);
            }}
          >
            <MessageCircle
              className={cn("size-3.5 sm:size-4", hasComment && "fill-current")}
            />
          </button>
          <button
            type="button"
            className="rounded-full bg-white/90 p-2 text-muted-foreground shadow-sm transition hover:text-foreground"
            aria-label="Delete photo"
            onClick={(event) => {
              event.stopPropagation();
              onDeleteRequest(item);
            }}
          >
            <Trash2 className="size-3.5 sm:size-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
