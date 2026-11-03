/**
 * What an examples file (`Name.examples.tsx`) can say to Bench, as types only: import from `@sragatiping/bench/example`, so the editor completes and checks it.
 *
 *     import type { Frame } from "@sragatiping/bench/example";
 *
 *     export function OnAPhone() { … }
 *     OnAPhone.frame = { name: "On a phone", device: "phone" } satisfies Frame;
 */

/**
 * What an example may say about its frame, written under it. All of it is optional, and it is only where the frame starts: the pane's device
 * choice and dragging the frame's edge still change it.
 */
export type Frame = {
  /** What the frame is called, in place of the export's name as words (`SignInNeeded` is "Sign in needed"). */
  name?: string;
  /** The screen the example starts on. */
  device?: "desktop" | "tablet" | "phone";
  /** The width of the frame in pixels, when it is on no device. */
  width?: number;
  /** The least height of the frame in pixels. A menu or popup drawn open does not make its frame taller, so an example that shows one says how much room it needs. */
  height?: number;
};
