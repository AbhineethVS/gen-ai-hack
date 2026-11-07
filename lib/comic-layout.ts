import type {
  BubblePlacement,
  DialogueLine,
  NormalizedPoint,
} from "@/lib/types";

export type BubbleLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
  tailTarget: NormalizedPoint;
};

type Rect = Pick<BubbleLayout, "x" | "y" | "width" | "height">;

const ZONES: Record<BubblePlacement, { x: number; y: number }> = {
  "top-left": { x: 0.04, y: 0.04 },
  "top-right": { x: 0.54, y: 0.04 },
  "middle-left": { x: 0.04, y: 0.3 },
  "middle-right": { x: 0.54, y: 0.3 },
};

const CANDIDATES: BubblePlacement[] = [
  "top-left",
  "top-right",
  "middle-left",
  "middle-right",
];

function overlaps(a: Rect, b: Rect) {
  const pad = 0.025;
  return !(
    a.x + a.width + pad <= b.x ||
    b.x + b.width + pad <= a.x ||
    a.y + a.height + pad <= b.y ||
    b.y + b.height + pad <= a.y
  );
}

function defaultTarget(placement: BubblePlacement): NormalizedPoint {
  const right = placement.endsWith("right");
  const middle = placement.startsWith("middle");
  return {
    x: right ? 0.66 : 0.34,
    y: middle ? 0.68 : 0.55,
  };
}

function estimateBox(line: DialogueLine) {
  const length = [...line.text_ml].length + [...line.speaker].length * 0.35;
  const width = length > 44 ? 0.46 : length > 28 ? 0.41 : 0.35;
  const charsPerLine = Math.max(14, Math.round(width * 48));
  const lines = Math.max(1, Math.ceil(length / charsPerLine));
  const height = Math.min(0.24, 0.105 + lines * 0.044);
  return { width, height };
}

/**
 * Deterministic layout: honor the LLM hint, then test alternate zones until
 * bubbles no longer collide. The lower quarter remains free for narration.
 */
export function layoutDialogue(lines: DialogueLine[]): BubbleLayout[] {
  const placed: BubbleLayout[] = [];

  for (const [index, line] of lines.slice(0, 3).entries()) {
    const preferred =
      line.placement && ZONES[line.placement]
        ? line.placement
        : index % 2 === 0
          ? "top-left"
          : "top-right";
    const order = [
      preferred,
      ...CANDIDATES.filter((candidate) => candidate !== preferred),
    ];
    const size = estimateBox(line);

    let chosen: BubbleLayout | null = null;
    for (const placement of order) {
      const zone = ZONES[placement];
      const candidate: BubbleLayout = {
        x: Math.min(0.96 - size.width, zone.x),
        y: Math.min(0.7 - size.height, zone.y),
        ...size,
        tailTarget: line.tail_target || defaultTarget(placement),
      };
      if (!placed.some((other) => overlaps(candidate, other))) {
        chosen = candidate;
        break;
      }
    }

    placed.push(
      chosen || {
        x: index % 2 === 0 ? 0.04 : 0.54,
        y: Math.min(0.68 - size.height, 0.04 + index * 0.2),
        ...size,
        tailTarget: line.tail_target || { x: 0.5, y: 0.62 },
      },
    );
  }

  return placed;
}
