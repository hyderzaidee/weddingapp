"use client";

import { useRef, useState } from "react";
import { ImagePlus, LoaderCircle, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  deleteInspirationImage,
  uploadInspirationImage,
} from "@/lib/storage";
import { cn } from "@/lib/utils";

const MAX_IMAGES = 8;

type InspirationImagesProps = {
  urls: string[];
  folder: string;
  onChange: (urls: string[]) => void | Promise<void>;
  className?: string;
};

export function InspirationImages({
  urls,
  folder,
  onChange,
  className,
}: InspirationImagesProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removingUrl, setRemovingUrl] = useState<string | null>(null);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList?.length) return;

    const remaining = MAX_IMAGES - urls.length;
    if (remaining <= 0) {
      toast.error(`You can add up to ${MAX_IMAGES} images.`);
      return;
    }

    const files = Array.from(fileList).slice(0, remaining);
    setIsUploading(true);

    try {
      const uploaded: string[] = [];
      for (const file of files) {
        uploaded.push(await uploadInspirationImage(file, folder));
      }
      await onChange([...urls, ...uploaded]);
      toast.success(uploaded.length === 1 ? "Image added." : "Images added.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to upload image."
      );
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleRemove(url: string) {
    setRemovingUrl(url);
    try {
      await deleteInspirationImage(url);
      await onChange(urls.filter((item) => item !== url));
      if (previewUrl === url) setPreviewUrl(null);
      toast.success("Image removed.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to remove image."
      );
    } finally {
      setRemovingUrl(null);
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap gap-2">
        {urls.map((url) => (
          <div
            key={url}
            className="group relative size-16 overflow-hidden rounded-lg border border-border bg-muted/60"
          >
            <button
              type="button"
              className="block size-full"
              onClick={() => setPreviewUrl(url)}
              aria-label="View image"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt="Inspiration"
                className="size-full object-cover"
              />
            </button>
            <button
              type="button"
              onClick={() => void handleRemove(url)}
              disabled={removingUrl === url}
              className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-foreground/70 text-primary-foreground opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
              aria-label="Remove image"
            >
              {removingUrl === url ? (
                <LoaderCircle className="size-3.5 animate-spin" />
              ) : (
                <Trash2 className="size-3.5" />
              )}
            </button>
          </div>
        ))}

        {urls.length < MAX_IMAGES ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-16 rounded-lg border-dashed"
            disabled={isUploading}
            onClick={() => inputRef.current?.click()}
            aria-label="Add inspiration image"
          >
            {isUploading ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <ImagePlus className="size-4 text-muted-foreground" />
            )}
          </Button>
        ) : null}
      </div>

      {urls.length === 0 ? (
        <p className="text-xs text-muted-foreground/80">Add inspo pics</p>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => void handleFiles(event.target.files)}
      />

      <Dialog
        open={previewUrl != null}
        onOpenChange={(open) => {
          if (!open) setPreviewUrl(null);
        }}
      >
        <DialogContent className="max-w-2xl p-2 sm:p-4">
          <DialogHeader className="sr-only">
            <DialogTitle>Inspiration image</DialogTitle>
          </DialogHeader>
          {previewUrl ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Inspiration preview"
                className="max-h-[70vh] w-full rounded-lg object-contain"
              />
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute right-2 top-2"
                onClick={() => setPreviewUrl(null)}
                aria-label="Close preview"
              >
                <X className="size-4" />
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
