"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  ImagePlus,
  Link2,
  LoaderCircle,
  StickyNote,
  Trash2,
} from "lucide-react";
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
import {
  deleteInspirationImage,
  uploadInspirationImage,
} from "@/lib/storage";
import { getSupabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  getVisionBoard,
  isVisionBoardId,
  normalizeExternalUrl,
  noteColorClass,
  NOTE_COLORS,
  randomBoardPosition,
} from "@/lib/vision-board";
import type {
  Database,
  VisionBoardItem,
  VisionBoardNoteColor,
} from "@/types/database";

type DragState = {
  id: string;
  offsetX: number;
  offsetY: number;
  moved: boolean;
  width: number;
  height: number;
};

function toItem(row: VisionBoardItem): VisionBoardItem {
  return {
    ...row,
    pos_x: Number(row.pos_x ?? 40),
    pos_y: Number(row.pos_y ?? 40),
    z_index: Number(row.z_index ?? 1),
  };
}

function resizeStickyTextarea(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}

function stickyNoteWidth(content: string) {
  const length = content.trim().length;
  if (length > 160) return 280;
  if (length > 80) return 250;
  return 200;
}

export default function VisionBoardPage() {
  const params = useParams<{ board: string }>();
  const router = useRouter();
  const boardParam = params.board;

  const [items, setItems] = useState<VisionBoardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [isSavingLink, setIsSavingLink] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);

  const board = isVisionBoardId(boardParam) ? boardParam : null;
  const boardMeta = board ? getVisionBoard(board) : null;

  const nextZ = useCallback(() => {
    return items.reduce((max, item) => Math.max(max, item.z_index), 0) + 1;
  }, [items]);

  const loadItems = useCallback(async () => {
    if (!board) return;

    try {
      const { data, error } = await getSupabase()
        .from("vision_board_items")
        .select("*")
        .eq("board", board)
        .order("created_at", { ascending: true });

      if (error) {
        toast.error(error.message || "Failed to load vision board.");
        setItems([]);
        return;
      }

      setItems((data ?? []).map(toItem));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load vision board."
      );
      setItems([]);
    }
  }, [board]);

  useEffect(() => {
    if (!board) {
      toast.error("Board not found.");
      router.replace("/vision-board");
      return;
    }

    let cancelled = false;

    async function initialLoad() {
      setIsLoading(true);
      await loadItems();
      if (!cancelled) setIsLoading(false);
    }

    void initialLoad();

    return () => {
      cancelled = true;
    };
  }, [board, loadItems, router]);

  async function persistPosition(
    itemId: string,
    pos_x: number,
    pos_y: number,
    z_index: number
  ) {
    try {
      const { error } = await getSupabase()
        .from("vision_board_items")
        .update({
          pos_x,
          pos_y,
          z_index,
        } as Database["public"]["Tables"]["vision_board_items"]["Update"])
        .eq("id", itemId);

      if (error) {
        toast.error(error.message || "Failed to save position.");
        await loadItems();
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save position."
      );
      await loadItems();
    }
  }

  function clampPosition(x: number, y: number, width: number, height: number) {
    return {
      pos_x: Math.max(8, Math.min(BOARD_WIDTH - width - 8, x)),
      pos_y: Math.max(8, Math.min(BOARD_HEIGHT - height - 8, y)),
    };
  }

  function handlePointerDown(
    event: ReactPointerEvent<HTMLElement>,
    item: VisionBoardItem
  ) {
    if ((event.target as HTMLElement).closest("[data-no-drag]")) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return;

    const itemRect = event.currentTarget.getBoundingClientRect();
    const scaleX = BOARD_WIDTH / rect.width;
    const scaleY = BOARD_HEIGHT / rect.height;
    const width = itemRect.width * scaleX;
    const height = itemRect.height * scaleY;
    const boardX = (event.clientX - rect.left) * scaleX;
    const boardY = (event.clientY - rect.top) * scaleY;

    const z_index = nextZ();
    dragRef.current = {
      id: item.id,
      offsetX: boardX - item.pos_x,
      offsetY: boardY - item.pos_y,
      moved: false,
      width,
      height,
    };
    setActiveId(item.id);
    setItems((current) =>
      current.map((row) => (row.id === item.id ? { ...row, z_index } : row))
    );
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLElement>) {
    const drag = dragRef.current;
    if (!drag) return;

    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return;

    const scaleX = BOARD_WIDTH / rect.width;
    const scaleY = BOARD_HEIGHT / rect.height;
    const boardX = (event.clientX - rect.left) * scaleX;
    const boardY = (event.clientY - rect.top) * scaleY;
    const next = clampPosition(
      boardX - drag.offsetX,
      boardY - drag.offsetY,
      drag.width,
      drag.height
    );

    drag.moved = true;
    setItems((current) =>
      current.map((row) =>
        row.id === drag.id
          ? { ...row, pos_x: next.pos_x, pos_y: next.pos_y }
          : row
      )
    );
  }

  function handlePointerUp() {
    const drag = dragRef.current;
    dragRef.current = null;
    setActiveId(null);
    if (!drag || !drag.moved) return;

    setItems((current) => {
      const item = current.find((row) => row.id === drag.id);
      if (item) {
        void persistPosition(item.id, item.pos_x, item.pos_y, item.z_index);
      }
      return current;
    });
  }

  async function handleAddNote() {
    if (!board) return;

    const color =
      NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)]!.id;
    const position = randomBoardPosition(Date.now());

    try {
      const { data, error } = await getSupabase()
        .from("vision_board_items")
        .insert({
          board,
          item_type: "note",
          content: "",
          note_color: color,
          pos_x: position.pos_x,
          pos_y: position.pos_y,
          z_index: nextZ(),
        })
        .select()
        .single();

      if (error) {
        toast.error(error.message || "Failed to add sticky note.");
        return;
      }

      setItems((current) => [...current, toItem(data)]);
      setEditingNoteId(data.id);
      toast.success("Sticky note added — drag it anywhere.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add sticky note."
      );
    }
  }

  async function handleFiles(fileList: FileList | null) {
    if (!board || !fileList?.length) return;

    setIsUploading(true);
    try {
      const uploaded: VisionBoardItem[] = [];
      let z = nextZ();

      for (const [index, file] of Array.from(fileList).entries()) {
        const imageUrl = await uploadInspirationImage(
          file,
          `vision-board/${board}`
        );
        const position = randomBoardPosition(Date.now() + index * 97);
        const { data, error } = await getSupabase()
          .from("vision_board_items")
          .insert({
            board,
            item_type: "image",
            image_url: imageUrl,
            pos_x: position.pos_x,
            pos_y: position.pos_y,
            z_index: z++,
          })
          .select()
          .single();

        if (error) {
          await deleteInspirationImage(imageUrl).catch(() => undefined);
          throw new Error(error.message || "Failed to save image.");
        }

        uploaded.push(toItem(data));
      }

      setItems((current) => [...current, ...uploaded]);
      toast.success(uploaded.length === 1 ? "Photo pinned." : "Photos pinned.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to upload photo."
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

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
      const position = randomBoardPosition(Date.now());
      const { data, error } = await getSupabase()
        .from("vision_board_items")
        .insert({
          board,
          item_type: "link",
          content: normalized,
          title: linkTitle.trim() || null,
          pos_x: position.pos_x,
          pos_y: position.pos_y,
          z_index: nextZ(),
        })
        .select()
        .single();

      if (error) {
        toast.error(error.message || "Failed to add link.");
        return;
      }

      setItems((current) => [...current, toItem(data)]);
      setLinkOpen(false);
      setLinkTitle("");
      setLinkUrl("");
      toast.success("Link pinned.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add link."
      );
    } finally {
      setIsSavingLink(false);
    }
  }

  async function handleUpdateNote(
    itemId: string,
    patch: {
      content?: string;
      note_color?: VisionBoardNoteColor;
    }
  ) {
    try {
      const { error } = await getSupabase()
        .from("vision_board_items")
        .update(
          patch as Database["public"]["Tables"]["vision_board_items"]["Update"]
        )
        .eq("id", itemId);

      if (error) {
        toast.error(error.message || "Failed to save note.");
        await loadItems();
        return;
      }

      setItems((current) =>
        current.map((item) =>
          item.id === itemId ? { ...item, ...patch } : item
        )
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save note."
      );
      await loadItems();
    }
  }

  async function handleDelete(item: VisionBoardItem) {
    try {
      const { error } = await getSupabase()
        .from("vision_board_items")
        .delete()
        .eq("id", item.id);

      if (error) {
        toast.error(error.message || "Failed to delete item.");
        return;
      }

      if (item.item_type === "image" && item.image_url) {
        await deleteInspirationImage(item.image_url).catch(() => undefined);
      }

      setItems((current) => current.filter((row) => row.id !== item.id));
      if (previewUrl === item.image_url) setPreviewUrl(null);
      toast.success("Removed.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete item."
      );
    }
  }

  if (!board || !boardMeta) {
    return null;
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            href="/vision-board"
            className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            All boards
          </Link>
          <h1 className="font-heading text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {boardMeta.label} whiteboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pin photos, links, and sticky notes on the same board. Drag to
            arrange — everyone can add and move things.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => void handleAddNote()}>
            <StickyNote className="size-4" />
            Sticky note
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <ImagePlus className="size-4" />
            )}
            Photo
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setLinkOpen(true)}
          >
            <Link2 className="size-4" />
            Link
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(event) => void handleFiles(event.target.files)}
          />
        </div>
      </div>

      <div className="-mx-4 overflow-auto px-4 pb-2 sm:mx-0 sm:px-0">
        <div
          ref={boardRef}
          className="relative mx-auto min-h-[70vh] w-[min(100%,1600px)] overflow-hidden rounded-2xl border border-black/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_18px_40px_rgba(60,30,10,0.12)]"
          style={{
            aspectRatio: `${BOARD_WIDTH} / ${BOARD_HEIGHT}`,
            backgroundColor: "#FAFAF7",
            backgroundImage:
              "radial-gradient(rgba(80,60,40,0.08) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        >
          {isLoading ? (
            <p className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
              Loading whiteboard…
            </p>
          ) : items.length === 0 ? (
            <p className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-muted-foreground">
              Empty whiteboard — add a sticky note, photo, or link, then drag it
              into place.
            </p>
          ) : null}

          {items.map((item) => {
            if (item.item_type === "note") {
              const width = stickyNoteWidth(item.content ?? "");
              return (
                <article
                  key={item.id}
                  className={cn(
                    "group absolute touch-none select-none rounded-md p-2.5 shadow-[2px_4px_14px_rgba(40,25,10,0.18)] ring-1 ring-black/5",
                    noteColorClass(item.note_color),
                    activeId === item.id &&
                      "cursor-grabbing ring-2 ring-maroon/30"
                  )}
                  style={{
                    left: `${(item.pos_x / BOARD_WIDTH) * 100}%`,
                    top: `${(item.pos_y / BOARD_HEIGHT) * 100}%`,
                    width: `${(width / BOARD_WIDTH) * 100}%`,
                    zIndex: item.z_index,
                    cursor: activeId === item.id ? "grabbing" : "grab",
                  }}
                  onPointerDown={(event) => handlePointerDown(event, item)}
                  onPointerMove={(event) => handlePointerMove(event)}
                  onPointerUp={() => handlePointerUp()}
                  onPointerCancel={() => handlePointerUp()}
                >
                  {editingNoteId === item.id ? (
                    <div
                      className="mb-1.5 flex items-center justify-between gap-2"
                      data-no-drag
                    >
                      <div className="flex flex-wrap gap-1">
                        {NOTE_COLORS.map((color) => (
                          <button
                            key={color.id}
                            type="button"
                            aria-label={color.label}
                            className={cn(
                              "size-3.5 rounded-full ring-1 ring-black/10",
                              color.className,
                              item.note_color === color.id &&
                                "ring-2 ring-foreground/40"
                            )}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() =>
                              void handleUpdateNote(item.id, {
                                note_color: color.id,
                              })
                            }
                          />
                        ))}
                      </div>
                      <button
                        type="button"
                        className="rounded-md p-1 opacity-70 transition hover:bg-black/5 hover:opacity-100"
                        aria-label="Delete sticky note"
                        onClick={() => void handleDelete(item)}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      data-no-drag
                      className="absolute right-1 top-1 rounded-md p-1 opacity-0 transition hover:bg-black/5 group-hover:opacity-70"
                      aria-label="Delete sticky note"
                      onClick={() => void handleDelete(item)}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                  {editingNoteId === item.id ? (
                    <textarea
                      data-no-drag
                      autoFocus
                      value={item.content ?? ""}
                      placeholder="Write on the sticky…"
                      rows={1}
                      className="block w-full resize-none overflow-hidden border-0 bg-transparent p-0 text-sm leading-snug outline-none placeholder:opacity-60"
                      ref={(el) => resizeStickyTextarea(el)}
                      onChange={(event) => {
                        resizeStickyTextarea(event.target);
                        setItems((current) =>
                          current.map((row) =>
                            row.id === item.id
                              ? { ...row, content: event.target.value }
                              : row
                          )
                        );
                      }}
                      onBlur={(event) => {
                        setEditingNoteId((current) =>
                          current === item.id ? null : current
                        );
                        void handleUpdateNote(item.id, {
                          content: event.target.value,
                        });
                      }}
                    />
                  ) : (
                    <p
                      data-no-drag
                      className="cursor-text whitespace-pre-wrap break-words text-sm leading-snug"
                      onClick={() => setEditingNoteId(item.id)}
                    >
                      {(item.content ?? "").trim() ? (
                        item.content
                      ) : (
                        <span className="opacity-55">Write on the sticky…</span>
                      )}
                    </p>
                  )}
                </article>
              );
            }

            if (item.item_type === "image" && item.image_url) {
              const width = 240;
              return (
                <article
                  key={item.id}
                  className={cn(
                    "absolute touch-none overflow-hidden rounded-lg bg-white p-2 shadow-[2px_6px_18px_rgba(40,25,10,0.18)] ring-1 ring-black/10",
                    activeId === item.id && "ring-2 ring-maroon/30"
                  )}
                  style={{
                    left: `${(item.pos_x / BOARD_WIDTH) * 100}%`,
                    top: `${(item.pos_y / BOARD_HEIGHT) * 100}%`,
                    width: `${(width / BOARD_WIDTH) * 100}%`,
                    zIndex: item.z_index,
                    cursor: activeId === item.id ? "grabbing" : "grab",
                  }}
                  onPointerDown={(event) => handlePointerDown(event, item)}
                  onPointerMove={(event) => handlePointerMove(event)}
                  onPointerUp={() => handlePointerUp()}
                  onPointerCancel={() => handlePointerUp()}
                >
                  <button
                    type="button"
                    data-no-drag
                    className="block w-full overflow-hidden rounded-md"
                    onClick={() => {
                      if (dragRef.current?.moved) return;
                      setPreviewUrl(item.image_url);
                    }}
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
                  <div className="mt-1 flex justify-end" data-no-drag>
                    <button
                      type="button"
                      className="rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                      aria-label="Delete photo"
                      onClick={() => void handleDelete(item)}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </article>
              );
            }

            if (item.item_type === "link" && item.content) {
              const width = 240;
              return (
                <article
                  key={item.id}
                  className={cn(
                    "absolute touch-none rounded-lg bg-white p-3 shadow-[2px_6px_18px_rgba(40,25,10,0.16)] ring-1 ring-black/10",
                    activeId === item.id && "ring-2 ring-maroon/30"
                  )}
                  style={{
                    left: `${(item.pos_x / BOARD_WIDTH) * 100}%`,
                    top: `${(item.pos_y / BOARD_HEIGHT) * 100}%`,
                    width: `${(width / BOARD_WIDTH) * 100}%`,
                    zIndex: item.z_index,
                    cursor: activeId === item.id ? "grabbing" : "grab",
                  }}
                  onPointerDown={(event) => handlePointerDown(event, item)}
                  onPointerMove={(event) => handlePointerMove(event)}
                  onPointerUp={() => handlePointerUp()}
                  onPointerCancel={() => handlePointerUp()}
                >
                  <div className="flex items-start justify-between gap-2">
                    <a
                      href={item.content}
                      target="_blank"
                      rel="noreferrer"
                      data-no-drag
                      className="min-w-0 flex-1 space-y-1"
                      onClick={(event) => {
                        if (dragRef.current?.moved) event.preventDefault();
                      }}
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
                      data-no-drag
                      className="rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                      aria-label="Delete link"
                      onClick={() => void handleDelete(item)}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </article>
              );
            }

            return null;
          })}
        </div>
      </div>

      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent>
          <form onSubmit={(event) => void handleAddLink(event)}>
            <DialogHeader>
              <DialogTitle>Pin a link</DialogTitle>
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
                Pin link
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(previewUrl)}
        onOpenChange={(open) => {
          if (!open) setPreviewUrl(null);
        }}
      >
        <DialogContent className="max-w-3xl border-0 bg-transparent p-0 shadow-none">
          <DialogHeader className="sr-only">
            <DialogTitle>Photo preview</DialogTitle>
          </DialogHeader>
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt=""
              className="max-h-[80vh] w-full rounded-2xl object-contain"
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
