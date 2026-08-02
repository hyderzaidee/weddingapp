"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ExternalLink, Link2, LoaderCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VisionBoardTabs } from "@/components/vision-board-tabs";
import { getSupabase } from "@/lib/supabase";
import {
  boardHeightForLinkCount,
  BOARD_WIDTH,
  getVisionBoard,
  isVisionBoardId,
  linkGridPosition,
  LINK_TILE_WIDTH,
  normalizeExternalUrl,
} from "@/lib/vision-board";
import type { Database, VisionBoardItem } from "@/types/database";

function toItem(row: VisionBoardItem): VisionBoardItem {
  return {
    ...row,
    pos_x: Number(row.pos_x ?? 40),
    pos_y: Number(row.pos_y ?? 40),
    z_index: Number(row.z_index ?? 1),
    scale: Number(row.scale ?? 1) || 1,
  };
}

export default function VisionBoardLinksPage() {
  const params = useParams<{ board: string }>();
  const router = useRouter();
  const boardParam = params.board;

  const [links, setLinks] = useState<VisionBoardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [isSavingLink, setIsSavingLink] = useState(false);

  const board = isVisionBoardId(boardParam) ? boardParam : null;
  const boardMeta = board ? getVisionBoard(board) : null;
  const boardHeight = useMemo(
    () => boardHeightForLinkCount(links.length),
    [links.length]
  );

  const syncLinkSlots = useCallback(async (allLinks: VisionBoardItem[]) => {
    const updates: { id: string; pos_x: number; pos_y: number }[] = [];

    allLinks.forEach((item, index) => {
      const slot = linkGridPosition(index);
      if (item.pos_x !== slot.pos_x || item.pos_y !== slot.pos_y) {
        updates.push({ id: item.id, ...slot });
      }
    });

    if (updates.length === 0) return allLinks;

    await Promise.all(
      updates.map((update) =>
        getSupabase()
          .from("vision_board_items")
          .update({
            pos_x: update.pos_x,
            pos_y: update.pos_y,
          } as Database["public"]["Tables"]["vision_board_items"]["Update"])
          .eq("id", update.id)
      )
    );

    const byId = new Map(updates.map((update) => [update.id, update]));
    return allLinks.map((item) => {
      const update = byId.get(item.id);
      return update
        ? { ...item, pos_x: update.pos_x, pos_y: update.pos_y }
        : item;
    });
  }, []);

  const loadLinks = useCallback(async () => {
    if (!board) return;

    try {
      const { data, error } = await getSupabase()
        .from("vision_board_items")
        .select("*")
        .eq("board", board)
        .eq("item_type", "link")
        .order("created_at", { ascending: true });

      if (error) {
        toast.error(error.message || "Failed to load links.");
        setLinks([]);
        return;
      }

      const normalized = (data ?? []).map(toItem);
      const slotted = await syncLinkSlots(normalized);
      setLinks(slotted);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load links."
      );
      setLinks([]);
    }
  }, [board, syncLinkSlots]);

  useEffect(() => {
    if (!board) {
      toast.error("Board not found.");
      router.replace("/vision-board");
      return;
    }

    let cancelled = false;

    async function initialLoad() {
      setIsLoading(true);
      await loadLinks();
      if (!cancelled) setIsLoading(false);
    }

    void initialLoad();

    return () => {
      cancelled = true;
    };
  }, [board, loadLinks, router]);

  async function handleAddLink(event: FormEvent) {
    event.preventDefault();
    if (!board) return;

    const normalized = normalizeExternalUrl(linkUrl);
    if (!normalized) {
      toast.error("Enter a valid link.");
      return;
    }

    setIsSavingLink(true);
    try {
      const position = linkGridPosition(links.length);
      const { data, error } = await getSupabase()
        .from("vision_board_items")
        .insert({
          board,
          item_type: "link",
          content: normalized,
          title: linkTitle.trim() || null,
          pos_x: position.pos_x,
          pos_y: position.pos_y,
          z_index: links.length + 1,
        })
        .select()
        .single();

      if (error) {
        toast.error(error.message || "Failed to add link.");
        return;
      }

      setLinks((current) => [...current, toItem(data)]);
      setLinkOpen(false);
      setLinkTitle("");
      setLinkUrl("");
      toast.success("Link added.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add link."
      );
    } finally {
      setIsSavingLink(false);
    }
  }

  async function handleDelete(item: VisionBoardItem) {
    try {
      const { error } = await getSupabase()
        .from("vision_board_items")
        .delete()
        .eq("id", item.id);

      if (error) {
        toast.error(error.message || "Failed to delete link.");
        return;
      }

      const remaining = links.filter((row) => row.id !== item.id);
      const slotted = await syncLinkSlots(remaining);
      setLinks(slotted);
      toast.success("Link removed.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete link."
      );
    }
  }

  if (!board || !boardMeta) {
    return null;
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1">
          <Link
            href="/vision-board"
            className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            All boards
          </Link>
          <h1 className="font-heading text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {boardMeta.label} links
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Links sit in fixed 4-across slots. The board grows as you add more.
          </p>
          <VisionBoardTabs boardId={board} active="links" />
        </div>

        <Button type="button" onClick={() => setLinkOpen(true)}>
          <Link2 className="size-4" />
          Add link
        </Button>
      </div>

      <div className="w-full overflow-x-hidden pb-2">
        <div
          className="relative w-full overflow-hidden rounded-2xl border border-black/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_18px_40px_rgba(60,30,10,0.12)]"
          style={{
            aspectRatio: `${BOARD_WIDTH} / ${boardHeight}`,
            backgroundColor: "#FAFAF7",
            backgroundImage:
              "radial-gradient(rgba(80,60,40,0.08) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        >
          {isLoading ? (
            <p className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
              Loading links…
            </p>
          ) : links.length === 0 ? (
            <p className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-muted-foreground">
              No links yet — add one.
            </p>
          ) : null}

          {links.map((item, index) => {
            if (!item.content) return null;
            const slot = linkGridPosition(index);
            return (
              <article
                key={item.id}
                className="absolute rounded-lg bg-white p-3 shadow-[2px_6px_18px_rgba(40,25,10,0.16)] ring-1 ring-black/10"
                style={{
                  left: `${(slot.pos_x / BOARD_WIDTH) * 100}%`,
                  top: `${(slot.pos_y / boardHeight) * 100}%`,
                  width: `${(LINK_TILE_WIDTH / BOARD_WIDTH) * 100}%`,
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <a
                    href={item.content}
                    target="_blank"
                    rel="noreferrer"
                    className="min-w-0 flex-1 space-y-1"
                  >
                    <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                      <ExternalLink className="size-3.5 shrink-0" />
                      <span className="truncate">
                        {item.title?.trim() || "Open link"}
                      </span>
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.content}
                    </p>
                  </a>
                  <button
                    type="button"
                    className="rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    aria-label="Delete link"
                    onClick={() => void handleDelete(item)}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent>
          <form onSubmit={(event) => void handleAddLink(event)}>
            <DialogHeader>
              <DialogTitle>Add a link</DialogTitle>
            </DialogHeader>
            <div className="mt-4 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="link-title">Title (optional)</Label>
                <Input
                  id="link-title"
                  value={linkTitle}
                  onChange={(event) => setLinkTitle(event.target.value)}
                  placeholder="Pinterest board, outfit inspo…"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="link-url">URL</Label>
                <Input
                  id="link-url"
                  value={linkUrl}
                  onChange={(event) => setLinkUrl(event.target.value)}
                  placeholder="https://"
                  required
                />
              </div>
            </div>
            <DialogFooter className="mt-5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLinkOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSavingLink}>
                {isSavingLink ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : null}
                Add link
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
