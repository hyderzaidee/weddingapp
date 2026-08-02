"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ImagePlus, Link2, LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { VisionBoardPhotoTile } from "@/components/vision-board-photo-tile";
import { VisionBoardTabs } from "@/components/vision-board-tabs";
import {
  deleteInspirationImage,
  uploadInspirationImage,
} from "@/lib/storage";
import { getSupabase } from "@/lib/supabase";
import {
  boardHeightForPhotoCount,
  BOARD_WIDTH,
  getVisionBoard,
  IMAGE_COLS,
  IMAGE_COLS_COMPACT,
  imageGridPosition,
  imageTileWidth,
  isVisionBoardId,
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

export default function VisionBoardPage() {
  const params = useParams<{ board: string }>();
  const router = useRouter();
  const boardParam = params.board;

  const [items, setItems] = useState<VisionBoardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [commentItem, setCommentItem] = useState<VisionBoardItem | null>(null);
  const [commentDraft, setCommentDraft] = useState("");
  const [isSavingComment, setIsSavingComment] = useState(false);
  const [deleteItem, setDeleteItem] = useState<VisionBoardItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [imageCols, setImageCols] = useState(IMAGE_COLS_COMPACT);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const board = isVisionBoardId(boardParam) ? boardParam : null;
  const boardMeta = board ? getVisionBoard(board) : null;

  const photos = useMemo(
    () => items.filter((item) => item.item_type === "image"),
    [items]
  );
  const tileWidth = useMemo(() => imageTileWidth(imageCols), [imageCols]);
  const boardHeight = useMemo(
    () => boardHeightForPhotoCount(photos.length, imageCols),
    [photos.length, imageCols]
  );

  const nextZ = useCallback(() => {
    return items.reduce((max, item) => Math.max(max, item.z_index), 0) + 1;
  }, [items]);

  // Persist canonical 4-col slots; mobile renders a 3-col layout without rewriting DB.
  const syncImageSlots = useCallback(async (allItems: VisionBoardItem[]) => {
    const images = allItems.filter((item) => item.item_type === "image");
    const updates: { id: string; pos_x: number; pos_y: number }[] = [];

    images.forEach((item, index) => {
      const slot = imageGridPosition(index, IMAGE_COLS);
      if (item.pos_x !== slot.pos_x || item.pos_y !== slot.pos_y) {
        updates.push({ id: item.id, ...slot });
      }
    });

    if (updates.length === 0) return allItems;

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
    return allItems.map((item) => {
      const update = byId.get(item.id);
      return update
        ? { ...item, pos_x: update.pos_x, pos_y: update.pos_y }
        : item;
    });
  }, []);

  const loadItems = useCallback(async () => {
    if (!board) return;

    try {
      const { data, error } = await getSupabase()
        .from("vision_board_items")
        .select("*")
        .eq("board", board)
        .eq("item_type", "image")
        .order("created_at", { ascending: true });

      if (error) {
        toast.error(error.message || "Failed to load vision board.");
        setItems([]);
        return;
      }

      const normalized = (data ?? []).map(toItem);
      const slotted = await syncImageSlots(normalized);
      setItems(slotted);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load vision board."
      );
      setItems([]);
    }
  }, [board, syncImageSlots]);

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

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1023px)");
    const sync = () =>
      setImageCols(media.matches ? IMAGE_COLS_COMPACT : IMAGE_COLS);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  async function handleFiles(fileList: FileList | null) {
    if (!board || !fileList?.length) return;

    setIsUploading(true);
    try {
      const uploaded: VisionBoardItem[] = [];
      let z = nextZ();
      const existingImages = items.filter(
        (item) => item.item_type === "image"
      ).length;

      for (const [index, file] of Array.from(fileList).entries()) {
        const imageUrl = await uploadInspirationImage(
          file,
          `vision-board/${board}`
        );
        const position = imageGridPosition(existingImages + index, IMAGE_COLS);
        const { data, error } = await getSupabase()
          .from("vision_board_items")
          .insert({
            board,
            item_type: "image",
            image_url: imageUrl,
            scale: 1,
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

  function openComment(item: VisionBoardItem) {
    setPreviewUrl(null);
    setDeleteItem(null);
    setCommentItem(item);
    setCommentDraft(item.content ?? "");
  }

  function closeComment() {
    if (isSavingComment) return;
    setCommentItem(null);
    setCommentDraft("");
  }

  async function handleSaveComment() {
    if (!commentItem) return;

    const nextContent = commentDraft.trim() || null;
    setIsSavingComment(true);
    try {
      const { error } = await getSupabase()
        .from("vision_board_items")
        .update({
          content: nextContent,
        } as Database["public"]["Tables"]["vision_board_items"]["Update"])
        .eq("id", commentItem.id);

      if (error) {
        toast.error(error.message || "Failed to save comment.");
        return;
      }

      setItems((current) =>
        current.map((item) =>
          item.id === commentItem.id ? { ...item, content: nextContent } : item
        )
      );
      setCommentItem(null);
      setCommentDraft("");
      toast.success(nextContent ? "Comment saved." : "Comment cleared.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save comment."
      );
    } finally {
      setIsSavingComment(false);
    }
  }

  function openDeleteConfirm(item: VisionBoardItem) {
    setPreviewUrl(null);
    setCommentItem(null);
    setDeleteItem(item);
  }

  async function handleConfirmDelete() {
    if (!deleteItem) return;

    setIsDeleting(true);
    try {
      const { error } = await getSupabase()
        .from("vision_board_items")
        .delete()
        .eq("id", deleteItem.id);

      if (error) {
        toast.error(error.message || "Failed to delete photo.");
        return;
      }

      if (deleteItem.image_url) {
        await deleteInspirationImage(deleteItem.image_url).catch(
          () => undefined
        );
      }

      const remaining = items.filter((row) => row.id !== deleteItem.id);
      const slotted = await syncImageSlots(remaining);
      setItems(slotted);
      if (previewUrl === deleteItem.image_url) setPreviewUrl(null);
      setDeleteItem(null);
      toast.success("Photo removed.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete photo."
      );
    } finally {
      setIsDeleting(false);
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
            {boardMeta.label} whiteboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pin photos and add comments. Open Links for ceremony URLs.
          </p>
          <VisionBoardTabs boardId={board} active="board" />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
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
          <Button type="button" variant="outline" asChild>
            <Link href={`/vision-board/${board}/links`}>
              <Link2 className="size-4" />
              Link
            </Link>
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
              Loading whiteboard…
            </p>
          ) : photos.length === 0 ? (
            <p className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-muted-foreground">
              Empty whiteboard — add a photo.
            </p>
          ) : null}

          {photos.map((item, index) => {
            const slot = imageGridPosition(index, imageCols);
            return (
              <VisionBoardPhotoTile
                key={item.id}
                item={item}
                leftPercent={(slot.pos_x / BOARD_WIDTH) * 100}
                topPercent={(slot.pos_y / boardHeight) * 100}
                widthPercent={(tileWidth / BOARD_WIDTH) * 100}
                onPreview={(url) => {
                  setCommentItem(null);
                  setDeleteItem(null);
                  setPreviewUrl(url);
                }}
                onComment={openComment}
                onDeleteRequest={openDeleteConfirm}
              />
            );
          })}
        </div>
      </div>

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

      <Dialog
        open={Boolean(commentItem)}
        onOpenChange={(open) => {
          if (!open) closeComment();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Comment</DialogTitle>
            <DialogDescription>
              Add a note for this photo. Leave blank and save to clear it.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={commentDraft}
            onChange={(event) => setCommentDraft(event.target.value)}
            placeholder="Write a comment…"
            rows={5}
            className="mt-2 min-h-28 text-base"
            autoFocus
          />
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              disabled={isSavingComment}
              onClick={closeComment}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isSavingComment}
              onClick={() => void handleSaveComment()}
            >
              {isSavingComment ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deleteItem)}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setDeleteItem(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this photo?</DialogTitle>
            <DialogDescription>
              This removes the photo from the board. You can’t undo this.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              disabled={isDeleting}
              onClick={() => setDeleteItem(null)}
            >
              No
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeleting}
              onClick={() => void handleConfirmDelete()}
            >
              {isDeleting ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : null}
              Yes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
