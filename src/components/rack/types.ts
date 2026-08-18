/** What is currently being dragged onto a rack. */
export type DragPayload =
  | { kind: "new"; deviceId: string }
  | { kind: "move"; itemId: string; rackId: string; deviceId: string };

/** Where it would land, and whether that is allowed. */
export interface DropPreview {
  rackId: string;
  startU: number;
  side: "left" | "right";
  height: number;
  full: boolean;
  valid: boolean;
}

export const U_HEIGHT = 28;
