import type { VisionBoardId } from "@/types/database";

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

export function isVisionBoardId(value: string): value is VisionBoardId {
  return VISION_BOARDS.some((board) => board.id === value);
}

export function getVisionBoard(id: VisionBoardId) {
  return VISION_BOARDS.find((board) => board.id === id)!;
}

export const BOARD_WIDTH = 1600;
export const BOARD_HEIGHT_MIN = 1100;
export const IMAGE_COLS = 4;
/** Prefer 3-across on phones/tablets so tiles stay readable. */
export const IMAGE_COLS_COMPACT = 3;
/** Board pixels — sized so 4 photos fit across the whiteboard. */
export const IMAGE_TILE_WIDTH = 360;
export const IMAGE_GAP_X = 28;
export const IMAGE_GAP_Y = 28;
export const IMAGE_GRID_PADDING = 36;
export const LINK_TILE_WIDTH = 360;
export const LINK_TILE_HEIGHT = 110;
export const LINK_COLS = 4;
export const LINK_GAP_X = 28;
export const LINK_GAP_Y = 24;
export const LINK_GRID_PADDING = 36;

/** Tile width so `cols` photos fit across the board with padding and gaps. */
export function imageTileWidth(cols: number = IMAGE_COLS) {
  if (cols === IMAGE_COLS) return IMAGE_TILE_WIDTH;
  const gaps = Math.max(0, cols - 1) * IMAGE_GAP_X;
  return Math.floor(
    (BOARD_WIDTH - IMAGE_GRID_PADDING * 2 - gaps) / Math.max(1, cols)
  );
}

export function imageTileHeight(cols: number = IMAGE_COLS) {
  return Math.round(imageTileWidth(cols) * 0.75) + 20;
}

/** Place photos in a fixed grid on the board. */
export function imageGridPosition(index: number, cols: number = IMAGE_COLS) {
  const tileWidth = imageTileWidth(cols);
  const tileHeight = imageTileHeight(cols);
  const col = index % cols;
  const row = Math.floor(index / cols);
  return {
    pos_x: IMAGE_GRID_PADDING + col * (tileWidth + IMAGE_GAP_X),
    pos_y: IMAGE_GRID_PADDING + row * (tileHeight + IMAGE_GAP_Y),
  };
}

export function boardHeightForPhotoCount(
  photoCount: number,
  cols: number = IMAGE_COLS
) {
  const rows = Math.max(1, Math.ceil(Math.max(photoCount, 1) / cols));
  const tileHeight = imageTileHeight(cols);
  const photosBottom =
    IMAGE_GRID_PADDING +
    rows * (tileHeight + IMAGE_GAP_Y) +
    IMAGE_GRID_PADDING;
  return Math.max(BOARD_HEIGHT_MIN, photosBottom + 220);
}

/** Place links in a fixed 4-across grid (same strategy as photos). */
export function linkGridPosition(index: number) {
  const col = index % LINK_COLS;
  const row = Math.floor(index / LINK_COLS);
  return {
    pos_x: LINK_GRID_PADDING + col * (LINK_TILE_WIDTH + LINK_GAP_X),
    pos_y: LINK_GRID_PADDING + row * (LINK_TILE_HEIGHT + LINK_GAP_Y),
  };
}

export function boardHeightForLinkCount(linkCount: number) {
  const rows = Math.max(1, Math.ceil(Math.max(linkCount, 1) / LINK_COLS));
  const linksBottom =
    LINK_GRID_PADDING +
    rows * (LINK_TILE_HEIGHT + LINK_GAP_Y) +
    LINK_GRID_PADDING;
  return Math.max(BOARD_HEIGHT_MIN, linksBottom + 80);
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
