import { getSupabase } from "@/lib/supabase";

const BUCKET = "inspiration";
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]);

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
}

function createUploadId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `img-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function isAllowedImage(file: File) {
  if (!file.type) {
    return /\.(jpe?g|png|gif|webp|heic|heif)$/i.test(file.name);
  }
  return ALLOWED_TYPES.has(file.type) || file.type.startsWith("image/");
}

export async function uploadInspirationImage(
  file: File,
  folder: string
): Promise<string> {
  if (!isAllowedImage(file)) {
    throw new Error("Please choose an image file.");
  }

  if (file.size > MAX_FILE_BYTES) {
    throw new Error("Image must be 5MB or smaller.");
  }

  const supabase = getSupabase();
  const path = `${folder}/${createUploadId()}-${sanitizeFileName(file.name)}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || "image/jpeg",
  });

  if (error) {
    throw new Error(error.message || "Failed to upload image.");
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  if (!data.publicUrl) {
    throw new Error("Failed to get image URL.");
  }

  return data.publicUrl;
}

export async function deleteInspirationImage(publicUrl: string): Promise<void> {
  const marker = `/${BUCKET}/`;
  const index = publicUrl.indexOf(marker);
  if (index === -1) return;

  const path = decodeURIComponent(publicUrl.slice(index + marker.length));
  const { error } = await getSupabase().storage.from(BUCKET).remove([path]);

  if (error) {
    throw new Error(error.message || "Failed to delete image.");
  }
}

export function normalizeImageUrls(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.length > 0);
}
