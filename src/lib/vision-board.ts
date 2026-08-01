import type { VisionBoardId, VisionBoardNoteColor } from "@/types/database";

export const VISION_BOARDS: {
  id: VisionBoardId;
  label: string;
  description: string;
}[] = [
  {
    id: "dholki",
    label: "Dholki",
    description: "Music, outfits, and night vibes",
  },
  {
    id: "mayon",
    label: "Mayon",
    description: "Yellows, florals, and mehndi mood",
  },
  {
    id: "barat",
    label: "Barat",
    description: "Baraat entry, décor, and looks",
  },
  {
    id: "valima",
    label: "Valima",
    description: "Reception glam and final flourishes",
  },
];

export const NOTE_COLORS: {
  id: VisionBoardNoteColor;
  label: string;
  className: string;
}[] = [
  { id: "gold", label: "Gold", className: "bg-[#F3E2A8] text-[#5C4310]" },
  { id: "blush", label: "Blush", className: "bg-[#F4C9C5] text-[#6B2E2E]" },
  { id: "mint", label: "Mint", className: "bg-[#C9E6D5] text-[#24543A]" },
  { id: "cream", label: "Cream", className: "bg-[#F7F0DE] text-[#4A3B28]" },
  { id: "lilac", label: "Lilac", className: "bg-[#E0D4EF] text-[#4A3566]" },
];

export function isVisionBoardId(value: string): value is VisionBoardId {
  return VISION_BOARDS.some((board) => board.id === value);
}

export function getVisionBoard(id: VisionBoardId) {
  return VISION_BOARDS.find((board) => board.id === id)!;
}

export function noteColorClass(color: VisionBoardNoteColor) {
  return (
    NOTE_COLORS.find((item) => item.id === color)?.className ??
    NOTE_COLORS[0].className
  );
}

export const BOARD_WIDTH = 1600;
export const BOARD_HEIGHT = 1100;

export function randomBoardPosition(seed = Date.now()) {
  const x = 60 + ((seed * 37) % (BOARD_WIDTH - 320));
  const y = 60 + ((seed * 53) % (BOARD_HEIGHT - 280));
  return {
    pos_x: Math.round(x / 20) * 20,
    pos_y: Math.round(y / 20) * 20,
  };
}

export function normalizeExternalUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const withProtocol = /^https?:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;
    const url = new URL(withProtocol);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}
